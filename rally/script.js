let numLeaders = 0;
let openRallyTime = 0;
let leaders = [];
let rallyTimer = null;
let rallyElapsed = 0;
let startedLeaders = new Set();
let useUtcTimeline = false;
let utcStartTimeSeconds = null;

function switchTab(tabName) {
    const coordinatorTab = document.getElementById('coordinator-tab');
    const enemyTab = document.getElementById('enemy-tab');
    const coordinatorBtn = document.getElementById('tabCoordinatorBtn');
    const enemyBtn = document.getElementById('tabEnemyBtn');

    if (!coordinatorTab || !enemyTab || !coordinatorBtn || !enemyBtn) {
        return;
    }

    if (tabName !== 'coordinator' && rallyTimer) {
        cancelCountdown();
    }

    const showCoordinator = tabName !== 'enemy';
    coordinatorTab.classList.toggle('hidden', !showCoordinator);
    enemyTab.classList.toggle('hidden', showCoordinator);
    coordinatorBtn.classList.toggle('active', showCoordinator);
    enemyBtn.classList.toggle('active', !showCoordinator);
}

function buildLeaderCard(index) {
    const leaderCard = document.createElement('div');
    leaderCard.className = 'leader-card';
    leaderCard.id = `leader-card-${index}`;
    leaderCard.innerHTML = `
        <h3>Rally Leader ${index}</h3>
        <div class="form-group mb-3">
            <label for="leader${index}Name" class="form-label">Leader Name:</label>
            <input type="text" id="leader${index}Name" class="form-control" placeholder="Enter leader name" required>
        </div>
        <div class="form-group mb-3">
            <label class="form-label">Marching Time to Center/Building:</label>
            <div class="time-inputs">
                <div>
                    <label for="leader${index}Minutes" class="form-label" style="font-size: 0.9em;">Minutes:</label>
                    <input type="number" id="leader${index}Minutes" class="form-control" min="0" max="60" value="0" placeholder="Minutes">
                </div>
                <div>
                    <label for="leader${index}Seconds" class="form-label" style="font-size: 0.9em;">Seconds:</label>
                    <input type="number" id="leader${index}Seconds" class="form-control" min="0" max="59" value="0" placeholder="Seconds">
                </div>
            </div>
        </div>
    `;
    return leaderCard;
}

function setupLeaders() {
    numLeaders = parseInt(document.getElementById('numLeaders').value);
    openRallyTime = parseInt(document.getElementById('openRallyTime').value);
    
    if (numLeaders < 2) {
        alert('Please enter at least 2 rally leaders!');
        return;
    }
    
    // Hide setup section and show leaders section
    document.getElementById('setup-section').classList.add('hidden');
    document.getElementById('leaders-section').classList.remove('hidden');
    
    // Generate input fields for each leader
    const leadersInputsDiv = document.getElementById('leadersInputs');
    leadersInputsDiv.innerHTML = '';
    
    for (let i = 1; i <= numLeaders; i++) {
        leadersInputsDiv.appendChild(buildLeaderCard(i));
    }
}

function addRallyLeader() {
    if (numLeaders >= 10) {
        alert('Maximum is 10 rally leaders.');
        return;
    }

    numLeaders += 1;
    document.getElementById('numLeaders').value = numLeaders;

    const leadersInputsDiv = document.getElementById('leadersInputs');
    leadersInputsDiv.appendChild(buildLeaderCard(numLeaders));

    const newNameInput = document.getElementById(`leader${numLeaders}Name`);
    if (newNameInput) {
        newNameInput.focus();
        newNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function addRallyLeaderFromResults() {
    if (rallyTimer) {
        cancelCountdown();
    }

    const currentCount = numLeaders;
    addRallyLeader();

    if (numLeaders === currentCount) {
        return;
    }

    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('leaders-section').classList.remove('hidden');
}

function parseTimeToSeconds(minutes, seconds) {
    return parseInt(minutes) * 60 + parseInt(seconds);
}

function parseUtcClockToSeconds(timeText) {
    if (!timeText) {
        return null;
    }

    const trimmed = timeText.trim();
    const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
    if (!match) {
        return null;
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;

    return (hours * 3600) + (minutes * 60) + seconds;
}

function formatUtcClock(totalSeconds) {
    const normalized = ((totalSeconds % 86400) + 86400) % 86400;
    const hours = Math.floor(normalized / 3600);
    const minutes = Math.floor((normalized % 3600) / 60);
    const seconds = normalized % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTimelineLabel(offsetSeconds) {
    if (!useUtcTimeline || utcStartTimeSeconds === null) {
        return `T+${formatTime(offsetSeconds)}`;
    }

    return `${formatUtcClock(utcStartTimeSeconds + offsetSeconds)} UTC (T+${formatTime(offsetSeconds)})`;
}

function toggleUtcTimeInput() {
    const useUtcCheckbox = document.getElementById('useUtcTimeline');
    const utcStartTimeInput = document.getElementById('utcStartTime');

    if (!useUtcCheckbox || !utcStartTimeInput) {
        return;
    }

    utcStartTimeInput.disabled = !useUtcCheckbox.checked;
    if (useUtcCheckbox.checked && !utcStartTimeInput.value) {
        utcStartTimeInput.value = '00:00:00';
    }
}

function syncUtcControlsFromState() {
    const useUtcCheckbox = document.getElementById('useUtcTimeline');
    const utcStartTimeInput = document.getElementById('utcStartTime');

    if (!useUtcCheckbox || !utcStartTimeInput) {
        return;
    }

    useUtcCheckbox.checked = useUtcTimeline;
    utcStartTimeInput.value = formatUtcClock(utcStartTimeSeconds === null ? 0 : utcStartTimeSeconds);
    toggleUtcTimeInput();
}

function applyUtcTimelineFromResults() {
    const useUtcCheckbox = document.getElementById('useUtcTimeline');
    const utcStartTimeInput = document.getElementById('utcStartTime');

    if (!useUtcCheckbox || !utcStartTimeInput) {
        return;
    }

    useUtcTimeline = useUtcCheckbox.checked;
    if (useUtcTimeline) {
        const parsedUtcStart = parseUtcClockToSeconds(utcStartTimeInput.value);
        if (parsedUtcStart === null) {
            alert('Please enter a valid UTC start time in 24-hour format (HH:MM or HH:MM:SS). Do not use AM/PM.');
            return;
        }
        utcStartTimeSeconds = parsedUtcStart;
    } else {
        utcStartTimeSeconds = null;
    }

    if (rallyTimer) {
        cancelCountdown();
    }

    displayResults();
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
        return `${mins}m ${secs}s`;
    } else if (mins > 0) {
        return `${mins}m`;
    } else {
        return `${secs}s`;
    }
}

function estimateEnemyHitTime() {
    const openRallyInput = document.getElementById('enemyOpenRallyTime');
    const marchMinutesInput = document.getElementById('enemyMarchMinutes');
    const marchSecondsInput = document.getElementById('enemyMarchSeconds');
    const startUtcInput = document.getElementById('enemyStartUtc');
    const resultsDiv = document.getElementById('enemyResults');

    if (!openRallyInput || !marchMinutesInput || !marchSecondsInput || !startUtcInput || !resultsDiv) {
        return;
    }

    const openRallySeconds = parseInt(openRallyInput.value, 10) || 0;
    const marchMinutes = parseInt(marchMinutesInput.value, 10);
    const marchSecondsValue = parseInt(marchSecondsInput.value, 10);

    if (
        Number.isNaN(marchMinutes) ||
        Number.isNaN(marchSecondsValue) ||
        marchMinutes < 0 ||
        marchMinutes > 60 ||
        marchSecondsValue < 0 ||
        marchSecondsValue > 59 ||
        (marchMinutes === 0 && marchSecondsValue === 0)
    ) {
        alert('Invalid enemy marching time. Please use 0-60 minutes and 0-59 seconds (not 0:00).');
        return;
    }

    const marchingSeconds = parseTimeToSeconds(marchMinutes, marchSecondsValue);
    const totalToHitSeconds = openRallySeconds + marchingSeconds;
    const startUtcText = startUtcInput.value.trim();

    let utcEstimateHtml = '';
    if (startUtcText) {
        const parsedStart = parseUtcClockToSeconds(startUtcText);
        if (parsedStart === null) {
            alert('Please enter enemy start UTC in 24-hour format (HH:MM or HH:MM:SS).');
            return;
        }

        const hitUtc = formatUtcClock(parsedStart + totalToHitSeconds);
        utcEstimateHtml = `<p><strong>Estimated Hit Clock Time:</strong> ${hitUtc} UTC</p>`;
    }

    resultsDiv.innerHTML = `
        <h3>Enemy Hit Estimate</h3>
        <p><strong>Total Time To Hit Building:</strong> ${formatTime(totalToHitSeconds)}</p>
        <p><strong>Breakdown:</strong> ${formatTime(openRallySeconds)} (open) + ${formatTime(marchingSeconds)} (march)</p>
        ${utcEstimateHtml}
    `;
    resultsDiv.classList.remove('hidden');
}

function clearEnemyEstimate() {
    const openRallyInput = document.getElementById('enemyOpenRallyTime');
    const marchMinutesInput = document.getElementById('enemyMarchMinutes');
    const marchSecondsInput = document.getElementById('enemyMarchSeconds');
    const startUtcInput = document.getElementById('enemyStartUtc');
    const resultsDiv = document.getElementById('enemyResults');

    if (openRallyInput) {
        openRallyInput.value = '60';
    }
    if (marchMinutesInput) {
        marchMinutesInput.value = '0';
    }
    if (marchSecondsInput) {
        marchSecondsInput.value = '0';
    }
    if (startUtcInput) {
        startUtcInput.value = '';
    }
    if (resultsDiv) {
        resultsDiv.innerHTML = '';
        resultsDiv.classList.add('hidden');
    }
}

function calculateTiming() {
    leaders = [];
    
    // Collect all leader data
    for (let i = 1; i <= numLeaders; i++) {
        const name = document.getElementById(`leader${i}Name`).value.trim();

        if (!name) {
            alert(`Please enter a leader name for Rally Leader ${i}!`);
            return;
        }

        const minutes = parseInt(document.getElementById(`leader${i}Minutes`).value) || 0;
        const seconds = parseInt(document.getElementById(`leader${i}Seconds`).value) || 0;
        const marchingTime = parseTimeToSeconds(minutes, seconds);
        
        if (marchingTime === 0) {
            alert(`Please enter a valid marching time for ${name}!`);
            return;
        }
        
        // Total time = open rally time + marching time
        const totalTime = openRallyTime + marchingTime;
        
        leaders.push({
            name: name,
            marchingTime: marchingTime,
            totalTime: totalTime,
            minutes: minutes,
            seconds: seconds,
            inputIndex: i
        });
    }
    
    // Sort leaders by total time (longest first)
    leaders.sort((a, b) => b.totalTime - a.totalTime);
    
    // Find the longest total time
    const longestTotalTime = leaders[0].totalTime;
    
    // Calculate when each leader should start their rally
    leaders.forEach((leader, index) => {
        leader.delay = longestTotalTime - leader.totalTime;
        leader.order = index + 1;
    });
    
    // Display results
    displayResults();
}

function displayResults() {
    // Hide leaders section and show results section
    document.getElementById('leaders-section').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const leadersByDelay = new Map();
    leaders.forEach((leader) => {
        if (!leadersByDelay.has(leader.delay)) {
            leadersByDelay.set(leader.delay, []);
        }
        leadersByDelay.get(leader.delay).push(leader.name);
    });
    
    // Add summary
    const summary = document.createElement('div');
    summary.className = 'summary';
    const longestTotalTime = leaders[0].totalTime;
    const longestMarchingTime = leaders[0].marchingTime;
    const firstStartLeaders = leadersByDelay.get(0) || [leaders[0].name];
    const firstStartLeadersLabel = firstStartLeaders
        .map((name) => `<span class="leader-highlight first-leader">${name}</span>`)
        .join(', ');
    const startHintText = firstStartLeaders.length > 1
        ? `Press <strong>Start</strong> when ${firstStartLeadersLabel} open their rallies.`
        : `Press <strong>Start</strong> when ${firstStartLeadersLabel} opens their rally.`;
    summary.innerHTML = `
        <h3>📋 Summary</h3>
        <p><strong>Number of Rally Leaders:</strong> ${numLeaders}</p>
        <p><strong>Open Rally Time (waiting period):</strong> ${formatTime(openRallyTime)}</p>
        <p><strong>Longest Marching Time:</strong> ${formatTime(longestMarchingTime)} <span class="leader-highlight first-leader">${leaders[0].name}</span></p>
        <p><strong>Longest Total Time:</strong> ${formatTime(longestTotalTime)} <span class="leader-highlight first-leader">${leaders[0].name}</span></p>
        <p><strong>All rallies will hit the target at the same time!</strong></p>
    `;
    resultsDiv.appendChild(summary);
    
    // Add each leader's timing
    leaders.forEach((leader, index) => {
        const resultCard = document.createElement('div');
        resultCard.className = index === 0 ? 'result-card first' : 'result-card';
        resultCard.id = `result-card-${index}`;
        
        let timingText = '';
        const sameTimeLeaders = (leadersByDelay.get(leader.delay) || []).filter((name) => name !== leader.name);
        if (index === 0) {
            if (sameTimeLeaders.length > 0) {
                timingText = `<p><strong>Start Rally:</strong> Start NOW! (Same time as ${sameTimeLeaders.join(', ')})</p>`;
            } else {
                timingText = `<p><strong>Start Rally:</strong> Start NOW! (First to rally)</p>`;
            }
        } else {
            if (sameTimeLeaders.length > 0) {
                timingText = `<p><strong>Start Rally:</strong> Start at the same time as ${sameTimeLeaders.join(', ')} (T+${formatTime(leader.delay)})</p>`;
            } else {
                timingText = `<p><strong>Start Rally:</strong> Wait ${formatTime(leader.delay)} after ${leaders[0].name} starts</p>`;
            }
        }
        
        resultCard.innerHTML = `
            <h3>${leader.name}</h3>
            <p><strong>Marching Time:</strong> ${formatTime(leader.marchingTime)}</p>
            <p><strong>Total Time:</strong> ${formatTime(openRallyTime)} (wait) + ${formatTime(leader.marchingTime)} (march) = ${formatTime(leader.totalTime)}</p>
            ${timingText}
            <span class="badge">Rally Order: #${leader.order}</span>
            <button onclick="editLeader(${index})" class="btn btn-edit">✏ Edit Leader</button>
        `;
        
        resultsDiv.appendChild(resultCard);
    });

    const resultsActions = document.createElement('div');
    resultsActions.className = 'results-actions d-flex flex-wrap gap-2 mb-3';
    resultsActions.innerHTML = '<button onclick="addRallyLeaderFromResults()" class="btn btn-add">+ Add Rally Leader</button>';
    resultsDiv.appendChild(resultsActions);
    
    // Add countdown panel
    const countdownPanel = document.createElement('div');
    countdownPanel.className = 'countdown-panel';
    countdownPanel.innerHTML = `
        <h3>⚔️ Rally Coordination Timer</h3>
        <p class="countdown-hint">${startHintText}</p>
        <div class="timer-controls">
            <button onclick="startCountdown()" id="startBtn" class="btn btn-start">▶ Start Rally</button>
            <button onclick="cancelCountdown()" id="cancelBtn" class="btn btn-cancel" disabled>✖ Cancel Timer</button>
        </div>
        <div id="leaderAlert" class="leader-alert hidden"></div>
        <div id="countdownDisplay" class="hidden">
            <div id="countdownNext" class="countdown-next"></div>
            <div id="countdownTimer" class="countdown-timer">--</div>
            <div id="leaderStatus" class="leader-status-list"></div>
        </div>
    `;
    resultsDiv.appendChild(countdownPanel);

    // Add UTC controls right before execution timeline
    const utcControls = document.createElement('div');
    utcControls.className = 'summary utc-results-panel';
    utcControls.innerHTML = `
        <h3>UTC Timeline</h3>
        <div class="form-group utc-option-group mb-3">
            <div class="utc-option-row form-check">
                <input type="checkbox" id="useUtcTimeline" class="form-check-input" onchange="toggleUtcTimeInput()">
                <label for="useUtcTimeline" class="form-check-label utc-checkbox-label">Use UTC time in Execution Timeline</label>
            </div>
        </div>
        <div class="form-group utc-time-row">
            <label for="utcStartTime" class="form-label">T (UTC Start Time):</label>
            <input type="text" id="utcStartTime" class="form-control" value="00:00:00" placeholder="HH:MM or HH:MM:SS (24-hour)" inputmode="numeric" autocomplete="off" disabled>
            <small class="utc-help">Use 24-hour UTC format (example: 13:45 or 13:45:00), then click Apply UTC.</small>
        </div>
        <button onclick="applyUtcTimelineFromResults()" class="btn btn-primary utc-apply-btn">Apply UTC</button>
    `;
    resultsDiv.appendChild(utcControls);
    syncUtcControlsFromState();

    // Add execution timeline
    const timeline = document.createElement('div');
    timeline.className = 'summary';
    timeline.innerHTML = useUtcTimeline
        ? '<h3>⏱️ Execution Timeline (UTC)</h3>'
        : '<h3>⏱️ Execution Timeline</h3>';
    
    leaders.forEach((leader, index) => {
        const timelineItem = document.createElement('p');
        const timelineLabel = formatTimelineLabel(leader.delay);
        const sameTimeLeaders = (leadersByDelay.get(leader.delay) || []).filter((name) => name !== leader.name);
        const sameTimeText = sameTimeLeaders.length > 0
            ? ` (same time as ${sameTimeLeaders.join(', ')})`
            : '';
        if (index === 0) {
            timelineItem.innerHTML = `<strong>${timelineLabel}:</strong> <span class="leader-highlight timeline-leader first-leader">${leader.name}</span> opens rally${sameTimeText} (waits ${formatTime(openRallyTime)}, then marches ${formatTime(leader.marchingTime)})`;
        } else {
            timelineItem.innerHTML = `<strong>${timelineLabel}:</strong> <span class="leader-highlight timeline-leader">${leader.name}</span> opens rally${sameTimeText} (waits ${formatTime(openRallyTime)}, then marches ${formatTime(leader.marchingTime)})`;
        }
        timeline.appendChild(timelineItem);
    });
    
    const hitTime = document.createElement('p');
    hitTime.innerHTML = `<strong>${formatTimelineLabel(longestTotalTime)}:</strong> 🎯 All rallies hit the target simultaneously!`;
    hitTime.style.color = '#4CAF50';
    hitTime.style.fontWeight = 'bold';
    hitTime.style.fontSize = '1.2em';
    hitTime.style.marginTop = '15px';
    timeline.appendChild(hitTime);
    
    resultsDiv.appendChild(timeline);
}

function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startCountdown() {
    const startBtn = document.getElementById('startBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (rallyTimer) {
        clearInterval(rallyTimer);
        rallyTimer = null;
    }

    startBtn.disabled = true;
    startBtn.textContent = '⏱️ Running...';
    cancelBtn.disabled = false;

    rallyElapsed = 0;
    const zeroDelayIndexes = leaders
        .map((leader, i) => ({ delay: leader.delay, index: i }))
        .filter((item) => item.delay === 0)
        .map((item) => item.index);
    startedLeaders = new Set(zeroDelayIndexes);

    document.getElementById('countdownDisplay').classList.remove('hidden');
    showLeaderAlert(zeroDelayIndexes);
    renderLeaderStatus();
    updateCountdownDisplay();

    rallyTimer = setInterval(() => {
        rallyElapsed++;
        const triggeredIndexes = [];
        leaders.forEach((leader, i) => {
            if (leader.delay === rallyElapsed && !startedLeaders.has(i)) {
                startedLeaders.add(i);
                triggeredIndexes.push(i);
            }
        });

        if (triggeredIndexes.length > 0) {
            showLeaderAlert(triggeredIndexes);
            renderLeaderStatus();
        }

        updateCountdownDisplay();
    }, 1000);
}

function cancelCountdown() {
    if (rallyTimer) {
        clearInterval(rallyTimer);
        rallyTimer = null;
    }

    rallyElapsed = 0;
    startedLeaders = new Set();

    const startBtn = document.getElementById('startBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const alertDiv = document.getElementById('leaderAlert');
    const display = document.getElementById('countdownDisplay');
    const nextEl = document.getElementById('countdownNext');
    const timerEl = document.getElementById('countdownTimer');
    const statusEl = document.getElementById('leaderStatus');

    startBtn.disabled = false;
    startBtn.textContent = '▶ Start Rally';
    cancelBtn.disabled = true;

    alertDiv.className = 'leader-alert hidden';
    alertDiv.innerHTML = '';

    display.classList.add('hidden');
    nextEl.innerHTML = '';
    timerEl.textContent = '--';
    timerEl.className = 'countdown-timer';
    statusEl.innerHTML = '';
}

function showLeaderAlert(indexes) {
    if (!indexes || indexes.length === 0) {
        return;
    }

    const alertDiv = document.getElementById('leaderAlert');
    const names = indexes.map((index) => leaders[index].name);
    const leadersLabel = names
        .map((name) => `<span class="leader-highlight">${name}</span>`)
        .join(', ');

    alertDiv.innerHTML = indexes.length === 1
        ? `🚨 ${leadersLabel} — START YOUR RALLY NOW!`
        : `🚨 ${leadersLabel} — START YOUR RALLIES NOW!`;
    alertDiv.classList.remove('fade-out');
    alertDiv.className = 'leader-alert alert-visible';
    setTimeout(() => alertDiv.classList.add('fade-out'), 3000);
}

function updateCountdownDisplay() {
    const nextIndex = leaders.findIndex((_, i) => !startedLeaders.has(i));
    const timerEl = document.getElementById('countdownTimer');
    const nextEl = document.getElementById('countdownNext');

    if (nextIndex === -1) {
        const timeToTarget = leaders[0].totalTime - rallyElapsed;
        if (timeToTarget <= 0) {
            clearInterval(rallyTimer);
            rallyTimer = null;
            nextEl.innerHTML = '';
            timerEl.innerHTML = '🎯 All rallies hit the target!';
            timerEl.className = 'countdown-timer target-hit';

            const startBtn = document.getElementById('startBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            startBtn.disabled = false;
            startBtn.textContent = '🔁 Start Again';
            cancelBtn.disabled = true;
        } else {
            const allMarching = rallyElapsed >= openRallyTime;
            nextEl.innerHTML = allMarching
                ? '🎯 All rallies marching — hitting target in:'
                : '⏳ All rallies opened — waiting to march. Target hits in:';
            timerEl.textContent = formatCountdown(timeToTarget);
            timerEl.className = 'countdown-timer';
        }
    } else {
        const nextLeader = leaders[nextIndex];
        const timeToNext = nextLeader.delay - rallyElapsed;
        const sameDelayNames = leaders
            .filter((leader, i) => !startedLeaders.has(i) && leader.delay === nextLeader.delay)
            .map((leader) => leader.name);
        const nextLabel = sameDelayNames
            .map((name) => `<span class="leader-highlight">${name}</span>`)
            .join(', ');

        nextEl.innerHTML = sameDelayNames.length > 1
            ? `Next: ${nextLabel} start together in:`
            : `Next: ${nextLabel} starts in:`;
        timerEl.textContent = formatCountdown(timeToNext);
        timerEl.className = 'countdown-timer';
    }
}

function renderLeaderStatus() {
    const statusDiv = document.getElementById('leaderStatus');
    statusDiv.innerHTML = leaders.map((leader, i) =>
        `<span class="leader-status-item ${startedLeaders.has(i) ? 'started' : 'waiting'}">
            ${startedLeaders.has(i) ? '✅' : '⏳'} ${leader.name}
        </span>`
    ).join('');
}

function editLeader(resultIndex) {
    const leader = leaders[resultIndex];
    const resultCard = document.getElementById(`result-card-${resultIndex}`);

    if (!leader || !resultCard) {
        return;
    }

    if (rallyTimer) {
        cancelCountdown();
    }

    resultCard.innerHTML = `
        <h3>Edit ${leader.name}</h3>
        <div class="inline-edit-grid">
            <div class="form-group mb-3">
                <label for="editLeaderName${resultIndex}" class="form-label">Leader Name:</label>
                <input type="text" id="editLeaderName${resultIndex}" class="form-control" value="${leader.name}" required>
            </div>
            <div class="inline-edit-row">
                <div class="form-group">
                    <label for="editLeaderMinutes${resultIndex}" class="form-label">Minutes:</label>
                    <input type="number" id="editLeaderMinutes${resultIndex}" class="form-control" min="0" max="60" value="${leader.minutes}">
                </div>
                <div class="form-group">
                    <label for="editLeaderSeconds${resultIndex}" class="form-label">Seconds:</label>
                    <input type="number" id="editLeaderSeconds${resultIndex}" class="form-control" min="0" max="59" value="${leader.seconds}">
                </div>
            </div>
        </div>
        <div class="inline-edit-actions">
            <button onclick="saveEditedLeader(${resultIndex})" class="btn btn-save-edit">Save</button>
            <button onclick="cancelEditedLeader()" class="btn btn-cancel-edit">Cancel</button>
        </div>
    `;
}

function saveEditedLeader(resultIndex) {
    const leader = leaders[resultIndex];
    if (!leader) {
        return;
    }

    const nameInput = document.getElementById(`editLeaderName${resultIndex}`);
    const minutesInput = document.getElementById(`editLeaderMinutes${resultIndex}`);
    const secondsInput = document.getElementById(`editLeaderSeconds${resultIndex}`);

    if (!nameInput || !minutesInput || !secondsInput) {
        return;
    }

    const newName = nameInput.value.trim();
    const newMinutes = parseInt(minutesInput.value, 10);
    const newSeconds = parseInt(secondsInput.value, 10);

    if (!newName) {
        alert('Leader name is required.');
        return;
    }

    if (
        Number.isNaN(newMinutes) ||
        Number.isNaN(newSeconds) ||
        newMinutes < 0 ||
        newMinutes > 60 ||
        newSeconds < 0 ||
        newSeconds > 59 ||
        (newMinutes === 0 && newSeconds === 0)
    ) {
        alert('Invalid time. Please use 0-60 minutes and 0-59 seconds (not 0:00).');
        return;
    }

    const originalIndex = leader.inputIndex;
    const originalName = document.getElementById(`leader${originalIndex}Name`);
    const originalMinutes = document.getElementById(`leader${originalIndex}Minutes`);
    const originalSeconds = document.getElementById(`leader${originalIndex}Seconds`);

    if (!originalName || !originalMinutes || !originalSeconds) {
        return;
    }

    originalName.value = newName;
    originalMinutes.value = newMinutes;
    originalSeconds.value = newSeconds;

    calculateTiming();
}

function cancelEditedLeader() {
    calculateTiming();
}

function reset() {
    // Reset all data
    if (rallyTimer) {
        clearInterval(rallyTimer);
        rallyTimer = null;
    }
    rallyElapsed = 0;
    startedLeaders = new Set();
    numLeaders = 0;
    openRallyTime = 0;
    leaders = [];
    useUtcTimeline = false;
    utcStartTimeSeconds = null;
    
    // Reset form
    document.getElementById('numLeaders').value = 2;
    document.getElementById('openRallyTime').value = 60;
    const useUtcCheckbox = document.getElementById('useUtcTimeline');
    const utcStartTimeInput = document.getElementById('utcStartTime');
    if (useUtcCheckbox) {
        useUtcCheckbox.checked = false;
    }
    if (utcStartTimeInput) {
        utcStartTimeInput.value = '00:00:00';
    }
    toggleUtcTimeInput();
    clearEnemyEstimate();
    switchTab('coordinator');
    
    // Show setup section and hide others
    document.getElementById('setup-section').classList.remove('hidden');
    document.getElementById('leaders-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');
}

toggleUtcTimeInput();
clearEnemyEstimate();
switchTab('coordinator');
