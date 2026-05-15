import mongoose from 'mongoose'

const registrationSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cpf: { type: String, required: true },
  email: { type: String, required: true },
  cep: { type: String, required: true },
  logradouro: { type: String, required: true },
  numero: { type: String, required: true },
  complemento: { type: String, default: '' },
  bairro: { type: String, required: true },
  localidade: { type: String, required: true },
  uf: { type: String, required: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true }
}, { timestamps: true })

export default mongoose.model('Registration', registrationSchema)
