import { defineConfig } from 'drizzle-kit';


export default defineConfig({
    schema: './src/db/schema',
    dialect: 'mysql',
    dbCredentials: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'swiftcode'
    }
})