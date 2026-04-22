import Fastify from 'fastify'
import cors from '@fastify/cors'
import pkg from 'pg'

const { Pool } = pkg

const pool = new Pool({
  user: 'postgres',
  password: 'senai',
  host: 'localhost',
  port: 5432,
  database: 'familia'
})

class FormRepository {
  async create(title, studentName) {
    const result = await pool.query(
      'INSERT INTO forms (title, student_name) VALUES ($1, $2) RETURNING *',
      [title, studentName]
    )
    return result.rows[0]
  }
}

class QuestionRepository {
  async create(formId, text, optionA, optionB, optionC, optionD, correctOption) {
    const result = await pool.query(
      'INSERT INTO questions (form_id, text, option_a, option_b, option_c, option_d, correct_option) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [formId, text, optionA, optionB, optionC, optionD, correctOption]
    )
    return result.rows[0]
  }

  async findByFormId(formId) {
    const result = await pool.query('SELECT * FROM questions WHERE form_id = $1', [formId])
    return result.rows
  }
}

class AttemptRepository {
  async create(formId, responderName, score) {
    const result = await pool.query(
      'INSERT INTO attempts (form_id, responder_name, score) VALUES ($1, $2, $3) RETURNING *',
      [formId, responderName, score]
    )
    return result.rows[0]
  }

  async getRanking(formId) {
    const result = await pool.query(
      'SELECT responder_name, score FROM attempts WHERE form_id = $1 ORDER BY score DESC',
      [formId]
    )
    return result.rows
  }
}

class CreateFormUseCase {
  constructor(formRepository) {
    this.formRepository = formRepository
  }
  async execute(data) {
    return await this.formRepository.create(data.title, data.studentName)
  }
}

class CreateQuestionUseCase {
  constructor(questionRepository) {
    this.questionRepository = questionRepository
  }
  async execute(data) {
    return await this.questionRepository.create(
      data.formId,
      data.text,
      data.optionA,
      data.optionB,
      data.optionC,
      data.optionD,
      data.correctOption
    )
  }
}

class SubmitAttemptUseCase {
  constructor(attemptRepository, questionRepository) {
    this.attemptRepository = attemptRepository
    this.questionRepository = questionRepository
  }
  async execute(data) {
    const questions = await this.questionRepository.findByFormId(data.formId)
    let score = 0

    for (const answer of data.answers) {
      const question = questions.find(q => q.id === answer.questionId)
      if (question && question.correct_option === answer.selectedOption) {
        score++
      }
    }

    return await this.attemptRepository.create(data.formId, data.responderName, score)
  }
}

class GetRankingUseCase {
  constructor(attemptRepository) {
    this.attemptRepository = attemptRepository
  }
  async execute(formId) {
    return await this.attemptRepository.getRanking(formId)
  }
}

const formRepo = new FormRepository()
const questionRepo = new QuestionRepository()
const attemptRepo = new AttemptRepository()

const createForm = new CreateFormUseCase(formRepo)
const createQuestion = new CreateQuestionUseCase(questionRepo)
const submitAttempt = new SubmitAttemptUseCase(attemptRepo, questionRepo)
const getRanking = new GetRankingUseCase(attemptRepo)

const app = Fastify()

await app.register(cors, { origin: '*' })

app.post('/forms', async (request, reply) => {
  const form = await createForm.execute(request.body)
  return reply.status(201).send(form)
})

app.post('/forms/:formId/questions', async (request, reply) => {
  const { formId } = request.params
  const data = { formId, ...request.body }
  const question = await createQuestion.execute(data)
  return reply.status(201).send(question)
})

app.post('/forms/:formId/attempts', async (request, reply) => {
  const { formId } = request.params
  const data = { formId, ...request.body }
  const attempt = await submitAttempt.execute(data)
  return reply.status(201).send(attempt)
})

app.get('/forms/:formId/ranking', async (request, reply) => {
  const { formId } = request.params
  const ranking = await getRanking.execute(formId)
  return reply.status(200).send(ranking)
})

await app.listen({ port: 3000 })
console.log('Servidor rodando na porta 3000')