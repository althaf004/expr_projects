//const pg = require('pg')
import pg from 'pg';
//const pgInfo = require('@wmfs/pg-info')
import pgInfo from '@wmfs/pg-info';
import pgDiffSync from 'pg-diff-sync';


// Make a new Postgres client
postgres://postgres:citrus123@10.10.11.249:5432/pgdcp_prime_althaf2
(async()=>{
  const client = new pg.Client('postgres://postgres:citrus123@10.10.11.249:5432/pgdcp_prime_althaf2')
await client.connect()
const info = await pgInfo({
    client: client,
    schemas: [
      'stateless_service_medigy_identity','public'
      // 'pginfo_planets_test',
      // 'pginfo_not_exists'
    ]    
})

const data = JSON.stringify(info);
  console.log(data); 
})();