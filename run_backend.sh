#!/bin/bash
   cd /home/robwistrand/code/solo/virgil/backend
   source venv/bin/activate
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
