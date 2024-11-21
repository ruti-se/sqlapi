# rutio-sqlapi

Simple async wrapper for some of the functions in mysql/mysql2, to hopefully make some code clearer using it. I have been using this code in several projects and it is quite practical, mostly stable as well...

A single DB connection is supported, and database details are set by environment variables. 
Connection remains open as long as process is active or until it is closed by remote host.

```
DB_HOST     host name for the database
DB_NAME     schema name for selected database
DB_USER     user name for the database user
DB_PASSWORD onomatopoetic
```

## Typical Use

```
// This will cause the connection to DB to be established, using the settings in environment
const sqlapi = require('rutio-sqlapi');

// Simple select, where an object contains the fields that should be matched
const test =  async () => {
    try {
        // Create a row in a table
        await sqlapi.create('customer', {name:'John', active:true});

        // Select
        const rows = await sqlapi.select('customer', {name:'John', active:true});
        rows.map(r->console.log(`Found user ${r.name}`));

        // Update all users named John to be not active
        await sqlapi.update('customer', {active:false}, {name:'John'});

        // Delete all rows with inactive users
        await sqlapi.remove('customer', {active:false});

        // Run a general query
        const result = await sqlapi.query('SELECT * FROM customer WHERE name LIKE 'Joe%');
    } catch (e) {
        console.log(e);
    }
}

test();

```
