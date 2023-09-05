import pg from 'pg';
import pgInfo from '@wmfs/pg-info';
import pgDiffSync from 'pg-diff-sync';


// Make a new Postgres client
(async()=>{
  const client = new pg.Client('postgres://postgres:citrus123@10.10.11.249:5432/pgdcp_prime_althaf2')
await client.connect()
const info = await pgInfo({
    client: client,
    schemas: [
      'stateless_service_medigy_identity',
      'public'
    ]    
})

const client2 = new pg.Client('postgres://postgres:citrus123@10.10.11.249:5432/pgdcp_prime_althaf3')
await client2.connect()
const info2 = await pgInfo({
    client: client2,
    schemas: [
      'stateless_service_medigy_identity',
      'public'
    ]    
})
//console.log(info2);
const data = JSON.stringify(info);
   const currentDbStructure = info2 
   const expectedDbStructure = info

  const statements = pgDiffSync(
    currentDbStructure,
    expectedDbStructure
  )
  console.log(statements); 
})();