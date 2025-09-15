# 🚀 WellDoc Coach - Startup Guide

This guide explains how to start both the frontend and backend servers simultaneously using the provided startup scripts.

## 📁 Available Startup Scripts

### 1. **start_app.bat** (Recommended)
- **Full-featured Windows batch script**
- Checks for dependencies and virtual environment
- Starts both servers in separate windows
- Automatically opens the application in your browser
- Provides detailed status messages

### 2. **start_simple.bat** 
- **Quick and simple Windows batch script**
- Minimal setup, just starts both servers
- Good for experienced users

### 3. **start_app.ps1**
- **PowerShell script with advanced features**
- Runs servers as background jobs
- Better error handling and monitoring
- Requires PowerShell execution policy changes

### 4. **stop_app.bat**
- **Cleanup script to stop all servers**
- Kills all Python and Node processes
- Frees up ports 8000 and 8080

## 🎯 Quick Start (Recommended)

### Option 1: Double-click the batch file
1. Simply **double-click** `start_app.bat` in Windows Explorer
2. The script will automatically:
   - Check dependencies
   - Start backend server (Port 8000)
   - Start frontend server (Port 8080) 
   - Open http://localhost:8080 in your browser

### Option 2: Run from Command Prompt
```cmd
# Navigate to project directory
cd d:\welldoc_coach

# Run the startup script
start_app.bat
```

### Option 3: PowerShell (Advanced)
```powershell
# You may need to allow script execution first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run:
.\start_app.ps1
```

## 🔧 What the Scripts Do

### Backend Server (FastAPI)
- **URL**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/docs
- **Features**: 
  - User authentication (JWT)
  - Health assessment endpoints
  - Cohere AI integration
  - Database operations

### Frontend Server (Vite + React)
- **URL**: http://localhost:8080
- **Features**:
  - Modern React UI with TypeScript
  - Real-time health dashboard
  - AI-powered health coaching
  - Responsive design

## 🛠️ Prerequisites

Make sure you have completed the initial setup:

1. **Python Virtual Environment**:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Frontend Dependencies**:
   ```cmd
   cd nurture-coach-main\nurture-coach-main
   npm install
   ```

3. **Database Setup**:
   ```cmd
   python app/init_db.py
   ```

## 🚨 Troubleshooting

### Common Issues:

1. **"Virtual environment not found"**
   - Run: `python -m venv venv`
   - Then: `pip install -r requirements.txt`

2. **"Frontend dependencies not found"**
   - The script will automatically run `npm install`
   - Or manually: `cd nurture-coach-main\nurture-coach-main && npm install`

3. **Port already in use**
   - Run `stop_app.bat` to kill existing processes
   - Or manually kill processes using ports 8000 and 8080

4. **PowerShell execution policy error**
   - Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Manual Startup (if scripts fail):

**Terminal 1 - Backend**:
```cmd
cd d:\welldoc_coach
venv\Scripts\activate
python -m uvicorn app.main:app --reload
```

**Terminal 2 - Frontend**:
```cmd
cd d:\welldoc_coach\nurture-coach-main\nurture-coach-main
npm run dev
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Two separate command windows** (Backend and Frontend)
2. **Backend logs** showing FastAPI server startup
3. **Frontend logs** showing Vite development server
4. **Browser automatically opens** to http://localhost:8080
5. **Application loads** with login/register interface

## 🔄 Stopping the Application

### Option 1: Close the windows
- Simply close the Backend and Frontend command windows

### Option 2: Use the stop script
- Double-click `stop_app.bat`
- Or run: `stop_app.bat` from command prompt

### Option 3: Manual cleanup
- Press `Ctrl+C` in each command window
- Or use Task Manager to end Python/Node processes

## 📞 Support

If you encounter any issues:
1. Check the console output in both server windows
2. Verify all prerequisites are installed
3. Try the manual startup method
4. Check the troubleshooting section above

---

**Happy coding! 🚀**
