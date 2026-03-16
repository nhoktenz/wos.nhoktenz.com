# Whiteout Survival - Rally Coordinator 🎯

A web-based tool to coordinate rally attacks in Whiteout Survival, ensuring all rally leaders hit the target simultaneously from different locations.

## 🎮 Features

- **Multi-leader Support**: Coordinate 2-10 rally leaders
- **Precise Timing**: Account for both open rally time and marching distance
- **Visual Timeline**: Clear execution timeline showing when each leader should start
- **Responsive Design**: Works on desktop and mobile devices
- **Easy to Use**: Simple, intuitive interface

## 🚀 How to Use

1. **Setup Phase**
   - Enter the number of rally leaders (2-10)
   - Select the open rally time (1, 3, 5, or 10 minutes)

2. **Enter Leader Information**
   - For each leader, enter:
     - Leader name
     - Marching time from their city to the target (minutes and seconds)

3. **View Results**
   - See exactly when each leader should start their rally
   - View the complete execution timeline
   - All rallies will hit the target at the same time!

## 📖 How It Works

The calculator uses this formula:
```
Total Time = Open Rally Time (waiting) + Marching Time
```

The leader with the **longest total time** starts first. Other leaders start later based on the time difference, ensuring all rallies arrive simultaneously.

### Example:
- Open Rally Time: 3 minutes
- Leader 1: 5 min march → 8 min total (starts first)
- Leader 2: 2:45 march → 5:45 total (waits 2:15)
- Leader 3: 4:20 march → 7:20 total (waits 0:40)

Result: All three rallies hit the target at the exact same time! ⚔️

## 🛠️ Installation

Simply open `index.html` in any modern web browser. No installation or server required!

## 📁 Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `script.js` - Calculation logic and interactivity

## 🎯 Game: Whiteout Survival

This tool is designed for players of Whiteout Survival who need to coordinate multiple rally attacks to ensure simultaneous hits on enemy buildings or targets.

## 📝 License

nhoktenz - 2608
