import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import Registration from './models/Registration.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqliteFile = path.join(__dirname, 'data', 'db.sqlite')

if (!fs.existsSync(path.dirname(sqliteFile))) {
  fs.mkdirSync(path.dirname(sqliteFile), { recursive: true })
}

const dbMapping = {
  mongodb: 'mongodb',
  mongo: 'mongodb',
  nosql: 'mongodb',
  document: 'mongodb',
  sqlite: 'sqlite',
  relational: 'sqlite',
  sql: 'sqlite'
}

export function normalizeDbType(type) {
  const key = String(type || '').trim().toLowerCase()
  return dbMapping[key] || 'mongodb'
}

export const defaultDbType = normalizeDbType(process.env.DB_TYPE || 'mongodb')

export const supportedDbTypes = {
  mongodb: 'MongoDB',
  sqlite: 'SQLite'
}

const sqlite3Driver = sqlite3.verbose()
let sqliteDb

async function initializeSqlite() {
  sqliteDb = await open({
    filename: sqliteFile,
    driver: sqlite3Driver.Database
  })
  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL,
      email TEXT NOT NULL,
      cep TEXT NOT NULL,
      logradouro TEXT NOT NULL,
      numero TEXT NOT NULL,
      complemento TEXT,
      bairro TEXT NOT NULL,
      localidade TEXT NOT NULL,
      uf TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
}

const mongoStorage = {
  list: async () => Registration.find().sort({ createdAt: -1 }).lean(),
  getById: async (id) => Registration.findById(id).lean(),
  create: async (payload) => Registration.create(payload),
  update: async (id, payload) => Registration.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean(),
  remove: async (id) => Registration.findByIdAndDelete(id)
}

const sqliteStorage = {
  list: async () => sqliteDb.all('SELECT * FROM registrations ORDER BY datetime(createdAt) DESC'),
  getById: async (id) => sqliteDb.get('SELECT * FROM registrations WHERE id = ?', id),
  create: async (payload) => {
    const now = new Date().toISOString()
    const result = await sqliteDb.run(
      `INSERT INTO registrations (nome, cpf, email, cep, logradouro, numero, complemento, bairro, localidade, uf, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      payload.nome,
      payload.cpf,
      payload.email,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento || '',
      payload.bairro,
      payload.localidade,
      payload.uf,
      now,
      now
    )
    return { id: result.lastID, ...payload, createdAt: now, updatedAt: now }
  },
  update: async (id, payload) => {
    const now = new Date().toISOString()
    const result = await sqliteDb.run(
      `UPDATE registrations SET nome = ?, cpf = ?, email = ?, cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, localidade = ?, uf = ?, updatedAt = ?
       WHERE id = ?`,
      payload.nome,
      payload.cpf,
      payload.email,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento || '',
      payload.bairro,
      payload.localidade,
      payload.uf,
      now,
      id
    )
    if (result.changes === 0) {
      return null
    }
    return sqliteDb.get('SELECT * FROM registrations WHERE id = ?', id)
  },
  remove: async (id) => sqliteDb.run('DELETE FROM registrations WHERE id = ?', id)
}

const storageMap = {
  mongodb: mongoStorage,
  sqlite: sqliteStorage
}

export function getStorage(type) {
  return storageMap[normalizeDbType(type)]
}

await initializeSqlite()
