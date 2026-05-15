## Overview 

is this one will initialize The ORM Session With Postgres That will used Throught the API Process to CRUD Methods Of the System 

did not Determine The Database schema yet but it will be the next step 

the get_db() will called in the API endpoints 

face me a problem that must called the next way with Depends of the FastAPI

`def Load_document( db: Session = Depends(get_db) )`

this will be the way we Handle the DB Process


postgres_engine this one like the Connection 
and sessionmaker is like the Curser 
that used to excute the sql query 