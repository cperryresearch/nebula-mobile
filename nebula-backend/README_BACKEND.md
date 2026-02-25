Run server:

cd nebula-backend
python -m uvicorn main:app --reload --port 8000

Test endpoints:

http://127.0.0.1:8000/health
http://127.0.0.1:8000/docs

Run backend
-----------

cd nebula-backend
python -m uvicorn main:app --reload --port 8000

Run frontend
------------

cd frontend
npm run dev