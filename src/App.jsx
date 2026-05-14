import { useEffect, useState } from 'react'
import axios from 'axios'

const initialAddress = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  numero: '1',
  complemento: '',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP'
}

const initialProfile = {
  nome: '',
  cpf: '',
  email: ''
}

const steps = [
  { id: 'address', label: 'Endereço' },
  { id: 'personal', label: 'Dados pessoais' },
  { id: 'list', label: 'Registros' }
]

const storageOptions = [
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'sqlite', label: 'SQLite' }
]

function App() {
  const [address, setAddress] = useState(initialAddress)
  const [profile, setProfile] = useState(initialProfile)
  const [step, setStep] = useState('address')
  const [dbType, setDbType] = useState(import.meta.env.VITE_DEFAULT_DB || 'mongodb')
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Use o CEP para carregar o endereço. Depois você pode editar.')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchAddress(initialAddress.cep)
  }, [])

  useEffect(() => {
    loadRegistrations()
  }, [dbType])

  const loadRegistrations = async () => {
    try {
      const response = await axios.get('/api/registrations', { params: { db: dbType } })
      setRegistrations(response.data)
    } catch (error) {
      console.error(error)
      setMessage('Erro ao carregar registros. Tente novamente em alguns instantes.')
    }
  }

  const fetchAddress = async (cepValue) => {
    const cleanedCep = cepValue.replace(/\D/g, '')
    if (cleanedCep.length !== 8) {
      setMessage('Informe um CEP válido com 8 dígitos.')
      return
    }

    try {
      setLoading(true)
      setMessage('Buscando endereço...')
      const response = await axios.get(`https://viacep.com.br/ws/${cleanedCep}/json/`)
      const data = response.data
      if (data.erro) {
        setMessage('CEP não encontrado. Verifique e tente novamente.')
        return
      }
      setAddress((prev) => ({
        ...prev,
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || ''
      }))
      setMessage('Endereço carregado. Você pode ajustar os campos se precisar.')
    } catch (error) {
      console.error(error)
      setMessage('Erro ao buscar CEP. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressChange = (event) => {
    const { name, value } = event.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearchCep = async (event) => {
    event.preventDefault()
    await fetchAddress(address.cep)
  }

  const handleSaveAddress = (event) => {
    event.preventDefault()
    setStep('personal')
    setMessage('Agora preencha seu nome, CPF e e-mail para concluir o cadastro.')
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    const payload = { ...profile, ...address }

    try {
      setLoading(true)
      if (editingId) {
        await axios.put(`/api/registrations/${editingId}`, payload, { params: { db: dbType } })
        setMessage('Registro atualizado com sucesso.')
      } else {
        await axios.post('/api/registrations', payload, { params: { db: dbType } })
        setMessage('Cadastro salvo! Você pode ver o registro na lista abaixo.')
      }
      setProfile(initialProfile)
      setAddress(initialAddress)
      setEditingId(null)
      setStep('list')
      loadRegistrations()
    } catch (error) {
      console.error(error)
      setMessage('Erro ao salvar registro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setAddress({
      cep: item.cep,
      logradouro: item.logradouro,
      numero: item.numero || '',
      complemento: item.complemento,
      bairro: item.bairro,
      localidade: item.localidade,
      uf: item.uf
    })
    setProfile({ nome: item.nome, cpf: item.cpf, email: item.email })
    setEditingId(item._id || item.id)
    setStep('personal')
    setMessage('Edição iniciada. Revise os dados e clique em salvar.')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir este registro?')) return

    try {
      await axios.delete(`/api/registrations/${id}`, { params: { db: dbType } })
      setMessage('Registro excluído com sucesso.')
      loadRegistrations()
    } catch (error) {
      console.error(error)
      setMessage('Erro ao excluir registro. Tente novamente.')
    }
  }

  return (
    <div className="container">
      <header className="hero-card">
        <div>
          <span className="eyebrow">Formulário inteligente</span>
          <h1>Cadastro com VIACEP</h1>
          <p>Busque o CEP automaticamente e preencha o endereço. Em seguida, cadastre nome, CPF e e-mail com facilidade.</p>
        </div>
        <div className="hero-meta">
          <strong>{registrations.length}</strong>
          <span>cadastros salvos</span>
          <label className="storage-label">
            Banco
            <select value={dbType} onChange={(event) => setDbType(event.target.value)}>
              {storageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="steps-bar">
        {steps.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`step-pill ${step === item.id ? 'active' : ''}`}
            onClick={() => item.id === 'list' ? setStep('list') : setStep(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && <div className="message">{message}</div>}

      {step === 'address' && (
        <form className="card form-card" onSubmit={handleSaveAddress}>
          <div className="form-header">
            <div>
              <p className="section-label">Etapa 1 de 2</p>
              <h2>Dados do endereço</h2>
            </div>
            <span className="badge">Endereço</span>
          </div>

          <div className="field-grid">
            <label>
              CEP
              <input
                type="text"
                name="cep"
                value={address.cep}
                onChange={handleAddressChange}
                placeholder="00000-000"
                required
              />
            </label>
            <label>
              Logradouro
              <input
                name="logradouro"
                value={address.logradouro}
                onChange={handleAddressChange}
                placeholder="Rua, avenida ou praça"
                required
              />
            </label>
            <label>
              Número
              <input
                name="numero"
                value={address.numero}
                onChange={handleAddressChange}
                placeholder="Número"
                required
              />
            </label>
            <label>
              Complemento
              <input
                name="complemento"
                value={address.complemento}
                onChange={handleAddressChange}
                placeholder="Apartamento, bloco, etc."
              />
            </label>
            <label>
              Bairro
              <input
                name="bairro"
                value={address.bairro}
                onChange={handleAddressChange}
                placeholder="Bairro"
                required
              />
            </label>
            <label>
              Cidade
              <input
                name="localidade"
                value={address.localidade}
                onChange={handleAddressChange}
                placeholder="Cidade"
                required
              />
            </label>
            <label>
              UF
              <input
                name="uf"
                value={address.uf}
                onChange={handleAddressChange}
                placeholder="UF"
                required
              />
            </label>
          </div>

          <div className="actions actions-end">
            <button type="button" className="secondary" onClick={handleSearchCep} disabled={loading}>
              Buscar CEP
            </button>
            <button type="submit" disabled={loading}>
              Continuar
            </button>
          </div>
        </form>
      )}

      {step === 'personal' && (
        <div className="form-layout">
          <form className="card form-card" onSubmit={handleSaveProfile}>
            <div className="form-header">
              <div>
                <p className="section-label">Etapa 2 de 2</p>
                <h2>Dados pessoais</h2>
              </div>
              <span className="badge accent">Pessoal</span>
            </div>

            <div className="field-grid">
              <label>
                Nome
                <input
                  name="nome"
                  value={profile.nome}
                  onChange={handleProfileChange}
                  placeholder="Nome completo"
                  required
                />
              </label>
              <label>
                CPF
                <input
                  name="cpf"
                  value={profile.cpf}
                  onChange={handleProfileChange}
                  placeholder="000.000.000-00"
                  required
                />
              </label>
              <label className="full-width">
                E-mail
                <input
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="seu@email.com"
                  required
                />
              </label>
            </div>

            <div className="actions actions-end">
              <button type="button" className="secondary" onClick={() => setStep('address')}>
                Voltar
              </button>
              <button type="submit" disabled={loading}>
                {editingId ? 'Atualizar registro' : 'Salvar cadastro'}
              </button>
            </div>
          </form>

          <div className="card summary-card">
            <h3>Endereço atual</h3>
            <p>{address.cep} · {address.logradouro}, {address.numero}</p>
            <p>{address.complemento || 'Sem complemento'} · {address.bairro}</p>
            <p>{address.localidade} / {address.uf}</p>
          </div>
        </div>
      )}

      <div className="card list-card">
        <div className="list-header">
          <div>
            <h2>Lista de cadastros</h2>
            <p className="small-text">Veja e gerencie os dados salvos no banco de dados.</p>
          </div>
          <button onClick={() => { setStep('address'); setProfile(initialProfile); setAddress(initialAddress); setEditingId(null); setMessage('Use o CEP para carregar o endereço.'); }} className="secondary">
            Novo cadastro
          </button>
        </div>

        {registrations.length === 0 ? (
          <p className="empty-state">Ainda não há registros salvos.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>E-mail</th>
                  <th>CEP</th>
                  <th>Logradouro</th>
                  <th>Número</th>
                  <th>Bairro</th>
                  <th>Cidade</th>
                  <th>UF</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((item) => (
                  <tr key={item._id || item.id}>
                    <td>{item.nome}</td>
                    <td>{item.cpf}</td>
                    <td>{item.email}</td>
                    <td>{item.cep}</td>
                    <td>{item.logradouro}</td>
                    <td>{item.numero}</td>
                    <td>{item.bairro}</td>
                    <td>{item.localidade}</td>
                    <td>{item.uf}</td>
                    <td className="actions-cell">
                      <button className="ghost" onClick={() => handleEdit(item)}>Editar</button>
                      <button className="danger" onClick={() => handleDelete(item._id || item.id)}>
                        Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
    </div>
  )
}

export default App
