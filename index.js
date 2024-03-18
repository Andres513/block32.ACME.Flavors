const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_flavors_db')
const app = express()

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/flavors', async(req, res, next) => {
    try {
       const SQL = `
       SELECT * from flavors;
       `
        const response = await client.query(SQL)
        res.send(response.rows)

    } catch(error) {
        next(error)
    }
})
app.post('/api/flavors/', async (req, res, next) => {
    try {
        const SQL = `
        INSERT INTO flavors(flavor)
        VALUES($1)
        RETURNING *
        `
        const response = await client.query(SQL, [req.body.flavor])
        res.send(response.rows[0])
    } catch(error) {
        next(error)
    }
})
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
        UPDATE flavors
        SET flavor=$1, updated_at= now()
        WHERE id=$2 RETURNING *
        `
        const response = await client.query(SQL, [req.body.flavor, req.params.id])
        res.send(response.rows[0])
    } catch(error) {
        next(error)
    }
})
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE from flavors
        WHERE id=$1
        `
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch(error) {
        next(error)
    }
})
const init = async() => {
    await client.connect()
    console.log('connected to database')
    
    let SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            flavor VARCHAR(255) NOT NULL
        )`;
    await client.query(SQL)
    console.log('tables created')

    SQL = `
        INSERT INTO flavors(flavor, is_favorite) VALUES('vanilla', 'true');
    `;
    await client.query(SQL)
    console.log('data seeded')

    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`))
}
init()