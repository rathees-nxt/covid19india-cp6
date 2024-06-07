const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//Returns a list of all states in the state table.
app.get('/states/', async (request, response) => {
  const statesQuery = `SELECT * FROM state`
  const stateArray = await db.all(statesQuery)
  const ans = dbObj => {
    return {
      stateId: dbObj.state_id,
      stateName: dbObj.state_name,
      population: dbObj.population,
    }
  }
  response.send(stateArray.map(state => ans(state)))
})

//Returns a state based on the state ID
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStatesQuery = `SELECT * FROM state where state_id=${stateId}`
  const getStateArray = await db.get(getStatesQuery)
  const ans = dbObj => {
    return {
      stateId: dbObj.state_id,
      stateName: dbObj.state_name,
      population: dbObj.population,
    }
  }
  response.send(ans(getStateArray))
})

//Create a district in the district table
app.post('/districts/', async (request, response) => {
  const toGetDistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = toGetDistrict
  const addDistrict = `
  INSERT INTO 
    district (district_name,state_id,cases,cured,active,deaths)
  VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths})`
  await db.run(addDistrict)
  response.send('District Successfully Added')
})

//Returns a district based on the district ID
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getStatesQuery = `SELECT * FROM district where district_id=${districtId}`
  const getStateArray = await db.get(getStatesQuery)
  const ans = dbObj => {
    return {
      districtId: dbObj.district_id,
      districtName: dbObj.district_name,
      stateId: dbObj.state_id,
      cases: dbObj.cases,
      cured: dbObj.cured,
      active: dbObj.active,
      deaths: dbObj.deaths,
    }
  }
  response.send(ans(getStateArray))
})

//Deletes a district from the district table based on the district ID
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `Delete from district where district_id=${districtId}`
  await db.run(deleteQuery)
  response.send('District Removed')
})

//Updates the details of a specific district based on the district ID
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistict = `
  update 
    district 
  set 
    district_name= '${districtName}',
    state_id= ${stateId},
    cases= ${cases},
    cured= ${cured},
    active= ${active},
    deaths= ${deaths}
  where
    district_id=${districtId}`
  await db.run(updateDistict)
  response.send('District Details Updated')
})

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatesStatsQuery = `SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths) FROM district where state_id=${stateId}`
  const stats = await db.get(getStatesStatsQuery)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

//Returns an object containing the state name of a district based on the district ID
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStatesQuery = `SELECT * FROM state,district where district_id=${districtId}`
  const getStateArray = await db.get(getStatesQuery)
  const ans = dbObj => {
    return {
      stateName: dbObj.state_name,
    }
  }
  response.send(ans(getStateArray))
})

module.exports = app
