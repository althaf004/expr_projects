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

// const currentDbStructure = info2 
//    const expectedDbStructure = info
const c1 = {generated :"2023-07-19T11:37:26.812Z",schemas :{stateless_service_medigy_identity :{schemaExistsInDatabase :true,comment :null,tables :{},views :{}},public :{schemaExistsInDatabase :true,comment :"standard public schema",tables :{blog_posts :{comment :null,pkColumnNames :["id"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},title :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :100,numericScale :null,comment :null,array :false},body :{columnDefault :null,isNullable :"YES",dataType :"text",characterMaximumLength :null,numericScale :null,comment :null,array :false},author_id :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},company :{comment :null,pkColumnNames :["id"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},name :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},address1 :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},address2 :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},city :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :30,numericScale :null,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},person :{comment :null,pkColumnNames :["id"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},name :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},address1 :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},address2 :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},city :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :30,numericScale :null,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons :{comment :null,pkColumnNames :[],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},firstname :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons1 :{comment :null,pkColumnNames :[],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :200,numericScale :null,comment :null,array :false},firstnames :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons2 :{comment :null,pkColumnNames :["id",lastname"],columns :{"id" :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},firstname :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons3 :{comment :null,pkColumnNames :["id",lastname"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},firstname :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons4_check :{comment :null,pkColumnNames :[],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},firstname :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},users :{comment :null,pkColumnNames :["id"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},name :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :100,numericScale :null,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}}},views :{vw_users :{columns :{id :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},name :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :100,numericScale :null,comment :null,array :false}},triggers :{},comment :null,sql :"SELECT users.id, users.name FROM users;"}}}}};

const c2 = {generated :"2023-07-19T11:37:26.812Z",schemas :{stateless_service_medigy_identity :{schemaExistsInDatabase :true,comment :null,tables :{},views :{}},public :{schemaExistsInDatabase :true,comment :"standard public schema",tables :{blog_posts :{comment :null,pkColumnNames :["id"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},title :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :100,numericScale :null,comment :null,array :false},body :{columnDefault :null,isNullable :"YES",dataType :"text",characterMaximumLength :null,numericScale :null,comment :null,array :false},author_id :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},company :{comment :null,pkColumnNames :["id"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},name :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},address1 :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},address2 :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},city :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :30,numericScale :null,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},person :{comment :null,pkColumnNames :["id"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},name :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},address1 :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},address2 :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :50,numericScale :null,comment :null,array :false},city :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :30,numericScale :null,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons :{comment :null,pkColumnNames :[],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},firstname :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons1 :{comment :null,pkColumnNames :[],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :200,numericScale :null,comment :null,array :false},firstnames :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons2 :{comment :null,pkColumnNames :["id",lastname"],columns :{"id" :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},firstname :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons3 :{comment :null,pkColumnNames :["id",lastname"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},firstname :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},persons4_check :{comment :null,pkColumnNames :[],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},lastname :{columnDefault :null,isNullable :"NO",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},firstname :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :255,numericScale :null,comment :null,array :false},age :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}},users :{comment :null,pkColumnNames :["id"],columns :{id :{columnDefault :null,isNullable :"NO",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},name :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :100,numericScale :null,comment :null,array :false}},indexes :{},triggers :{},functions :{},fkConstraints :{}}},views :{vw_users :{columns :{id :{columnDefault :null,isNullable :"YES",dataType :"integer",characterMaximumLength :null,numericScale :0,comment :null,array :false},name :{columnDefault :null,isNullable :"YES",dataType :"character varying",characterMaximumLength :100,numericScale :null,comment :null,array :false}},triggers :{},comment :null,sql :"SELECT users.id, users.name FROM users;"}}}}};

const data = JSON.stringify(info);
const data2 = JSON.stringify(info2);

   const currentDbStructure = c2
   const expectedDbStructure = c1

  const statements = pgDiffSync(
    currentDbStructure,
    expectedDbStructure
  )
  console.log(statements); 
})();