import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import Registration from './models/Registration.js'
import User from './models/User.js'

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
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
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
      ownerId TEXT NOT NULL,
      ownerName TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
}

const mongoStorage = {
  list: async (userId) => Registration.find({ ownerId: userId }).sort({ createdAt: -1 }).lean(),
  getById: async (id, userId) => Registration.findOne({ _id: id, ownerId: userId }).lean(),
  create: async (payload) => Registration.create(payload),
  update: async (id, payload, userId) => Registration.findOneAndUpdate({ _id: id, ownerId: userId }, payload, { new: true, runValidators: true }).lean(),
  remove: async (id, userId) => Registration.findOneAndDelete({ _id: id, ownerId: userId }),
  findUserByUsername: async (username) => User.findOne({ username }).lean(),
  createUser: async (user) => User.create(user)
}

const sqliteStorage = {
  list: async (userId) => sqliteDb.all('SELECT * FROM registrations WHERE ownerId = ? ORDER BY datetime(createdAt) DESC', userId),
  getById: async (id, userId) => sqliteDb.get('SELECT * FROM registrations WHERE id = ? AND ownerId = ?', id, userId),
  create: async (payload) => {
    const now = new Date().toISOString()
    const result = await sqliteDb.run(
      `INSERT INTO registrations (nome, cpf, email, cep, logradouro, numero, complemento, bairro, localidade, uf, ownerId, ownerName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      payload.ownerId,
      payload.ownerName,
      now,
      now
    )
    return { id: result.lastID, ...payload, createdAt: now, updatedAt: now }
  },
  update: async (id, payload, userId) => {
    const now = new Date().toISOString()
    const result = await sqliteDb.run(
      `UPDATE registrations SET nome = ?, cpf = ?, email = ?, cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, localidade = ?, uf = ?, ownerName = ?, updatedAt = ?
       WHERE id = ? AND ownerId = ?`,
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
      payload.ownerName,
      now,
      id,
      userId
    )
    if (result.changes === 0) {
      return null
    }
    return sqliteDb.get('SELECT * FROM registrations WHERE id = ? AND ownerId = ?', id, userId)
  },
  remove: async (id, userId) => sqliteDb.run('DELETE FROM registrations WHERE id = ? AND ownerId = ?', id, userId),
  findUserByUsername: async (username) => sqliteDb.get('SELECT * FROM users WHERE username = ?', username),
  createUser: async (user) => {
    const now = new Date().toISOString()
    const result = await sqliteDb.run(
      `INSERT INTO users (username, passwordHash, createdAt, updatedAt)
       VALUES (?, ?, ?, ?)`,
      user.username,
      user.passwordHash,
      now,
      now
    )
    return { id: result.lastID, username: user.username, createdAt: now, updatedAt: now }
  }
}

const storageMap = {
  mongodb: mongoStorage,
  sqlite: sqliteStorage
}

export function getStorage(type) {
  return storageMap[normalizeDbType(type)]
}

export function getAuthStorage(type) {
  return storageMap[normalizeDbType(type)]
}

await initializeSqlite()
