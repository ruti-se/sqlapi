// Copyright (C) 2021-2024, Rutio AB, All rights reserved
// Author: Lars Mats


const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Database access

if (!process.env.DB_HOST)
  throw {message:"DB_HOST not set in environment"};
if (!process.env.DB_NAME)
  throw {message:"DB_NAME not set in environment"};
if (!process.env.DB_USER)
  throw {message:"DB_USER not set in environment"};
if (!process.env.DB_PASSWORD)
  throw {mesage:"DB_PASSWORD not set in environment"};

// MySQL
var config = {
    host: process.env.DB_HOST,
    user:  process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    connectionLimit: 100,
    debug: false,
};
if (process.env.DB_PORT)
  config.port = process.env.DB_PORT;

// Wrapper for sql
const util = require( 'util' );
const mysql = require( 'mysql2' );

// Wrapping DB as promises
function makeDb( config ) {
  let pool = mysql.createPool( config );
  return {
    query( sql, args ) {
      return util.promisify( pool.query )
                 .call( pool, sql, args );
    },
    close() {
      return util.promisify( pool.end ).call( pool );
    }
  };
}
  
let db;
let ok = false;
let failCount = 0;
while (!ok) {
  try {
    db = makeDb( config );
    ok = true;
  } catch (e) {
    console.log(e.message);
    failCount++;
    if (failCount > 10) {
      console.log("Giving up database connection after 10 tries...");
      process.exit(1);
    }
    console.log("Retrying database connection in 5 seconds...");
    sleep(5000); // Wait for DB process to start and initialize
  }
}
console.log(`*** Connected to sql database ${config.database} ***`);

// Various DB helpers
const value = (x) => mysql.escape(x);
const fields = (obj, t) => '(' + Object.keys(obj).reduce((p, c) => p.length>0 ? p + `, \`${t}\`.\`${c}\`` : `\`${t}\`.\`${c}\``, '') + ')';
const values = (obj) => '(' + Object.keys(obj).reduce((p, c) => (p.length>0 ? p + ', ':'') + value(obj[c]), '') + ')';
const assign = (obj) => Object.keys(obj).reduce((p, c) => (p.length>0? p + ', `':'`') + c +'`='+value(obj[c]), '');
const assignAND = (obj, t) => Object.keys(obj).reduce((p, c) => (p.length>0? p + ` AND ${t}.`:`${t}.`) + c +'='+value(obj[c]), '');

exports.escape = value;
exports.insert = async (table, obj) => {
  try {
    const q = `INSERT INTO \`${table}\` ` + fields(obj,table) + ' VALUES ' + values(obj) +';';
    // console.log (q);
    return (await db.query(q)).insertId;
  } catch (err) { console.log(err); throw {message: 'Bad insert'}; };
}

exports.update = async (table, obj, where) => {
  try {
    const q = `UPDATE \`${table}\` SET \`${table}\`.` + assign(obj) + ` WHERE ` + assignAND(where,table)+';';
    //  console.log (q);
    return await db.query(q);
  } catch (err) { console.log(err); throw { message: 'Bad update'}; }
}

exports.remove = async (table, where) => {
  try {
    const q = `DELETE FROM \`${table}\` WHERE ` + assignAND(where,table)+';'
    //    console.log(q);
    return await db.query(q);
  } catch (err) { console.log(err); throw {message: 'Bad delete'}; }
}

exports.select = async (table, where) => {
  try {
    const q = `SELECT * FROM \`${table}\` WHERE ` + assignAND(where,table)+';';
    //    console.log(q);
    const res = await db.query(q);
    return res;
  } catch (err) { console.log(err); throw {message: 'Select failed'}; }
}

exports.query = async (q) => {
  try {
    return await db.query(q);
  } catch (err) { console.log(err); throw {message: 'Query failed'}; }
}
