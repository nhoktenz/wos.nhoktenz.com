# Rally Coordinator 🎯

Rally timing tool for Whiteout Survival to make multiple leaders hit the target at the same time.

## Live Page

- https://wos.nhoktenz.com/rally/

## Features

- Coordinate 2-10 rally leaders
- Open-rally duration + march-time calculation
- Execution timeline with T+ offsets
- Countdown timer with start alerts
- Handles same-start leaders (tie timing)
- Edit leader card directly from results
- Enemy hit estimator tab with multiple enemy rallies and per-rally UTC input
- My march timing recommendation to arrive 1 second after the first enemy hit
- Optional UTC time support

## How It Works

Formula:

```
Total Time = Open Rally Time + Marching Time
```

- Leader with longest total time starts first.
- Others start after a delay equal to the difference.
- Result: all rallies hit at the same time.

## Files

- `index.html` - Rally Coordinator UI
- `script.js` - Rally logic, enemy estimator, timer, edit flow
- `styles.css` - Styling

## Author

Created by [ADT]『ᴺʰᵒˣᴛᴇɴᴢᴬᴰᵀ༒天ヅ』- 2608
