import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getStorage, normalizeDbType, defaultDbType } from './storage.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/viacep-react'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto123'
const DEFAULT_DB = defaultDbType

app.use(cors())
app.use(express.json())

let mongoConnected = false
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    mongoConnected = true
    console.log('Conectado ao MongoDB')
  })
  .catch((error) => {
    console.warn('MongoDB não disponível. SQLite ainda pode ser usado:', error.message)
  })

const resolveDbType = (req) => {
  const requested = req.query.db || req.headers['x-db-type'] || process.env.DB_TYPE || DEFAULT_DB
  return normalizeDbType(requested)
}

const storageFromRequest = (req) => {
  const dbType = resolveDbType(req)
  return { dbType, storage: getStorage(dbType) }
}

const ensureMongoAvailable = (dbType, res) => {
  if (dbType === 'mongodb' && !mongoConnected) {
    res.status(503).json({ error: 'MongoDB não disponível no momento.' })
    return false
  }
  return true
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = { id: payload.id, username: payload.username }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' })
    }

    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return

    const existingUser = await storage.findUserByUsername(username)
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await storage.createUser({ username, passwordHash })
    const token = jwt.sign({ id: String(user.id), username: user.username }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, username: user.username })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' })
    }

    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return

    const user = await storage.findUserByUsername(username)
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const token = jwt.sign({ id: String(user.id), username: user.username }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, username: user.username })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/registrations', authenticate, async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    const registrations = await storage.list(req.user.id)
    res.json(registrations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/registrations/:id', authenticate, async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    const registration = await storage.getById(req.params.id, req.user.id)
    if (!registration) {
      return res.status(404).json({ error: 'Registro não encontrado' })
    }
    res.json(registration)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/registrations', authenticate, async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    const payload = {
      ...req.body,
      ownerId: req.user.id,
      ownerName: req.user.username
    }
    const registration = await storage.create(payload)
    res.status(201).json(registration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/registrations/:id', authenticate, async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    const payload = {
      ...req.body,
      ownerId: req.user.id,
      ownerName: req.user.username
    }
    const registration = await storage.update(req.params.id, payload, req.user.id)
    if (!registration) {
      return res.status(404).json({ error: 'Registro não encontrado' })
    }
    res.json(registration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/registrations/:id', authenticate, async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    await storage.remove(req.params.id, req.user.id)
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
  console.log(`Banco padrão: ${DEFAULT_DB}`)
})
