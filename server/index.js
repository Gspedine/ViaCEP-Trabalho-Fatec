import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { getStorage, normalizeDbType, defaultDbType } from './storage.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/viacep-react'
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

app.get('/api/registrations', async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    const registrations = await storage.list()
    res.json(registrations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/registrations/:id', async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    const registration = await storage.getById(req.params.id)
    if (!registration) {
      return res.status(404).json({ error: 'Registro não encontrado' })
    }
    res.json(registration)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/registrations', async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    const registration = await storage.create(req.body)
    res.status(201).json(registration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/registrations/:id', async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    const registration = await storage.update(req.params.id, req.body)
    if (!registration) {
      return res.status(404).json({ error: 'Registro não encontrado' })
    }
    res.json(registration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/registrations/:id', async (req, res) => {
  try {
    const { dbType, storage } = storageFromRequest(req)
    if (!ensureMongoAvailable(dbType, res)) return
    await storage.remove(req.params.id)
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
  console.log(`Banco padrão: ${DEFAULT_DB}`)
})
