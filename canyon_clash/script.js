let players = [];

function downloadPlayerList() {
    if (players.length === 0) {
        alert('No players to save!');
        return;
    }
    const blob = new Blob([JSON.stringify(players, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canyon_clash_players.json';
    a.click();
    URL.revokeObjectURL(url);
}

function uploadPlayerList(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data) || data.some(p => !p.name || typeof p.power !== 'number')) {
                alert('Invalid player list file.');
                return;
            }
            players = data.map(p => ({ name: String(p.name).trim(), power: Math.max(1, parseInt(p.power, 10)) }));
            renderPlayersList();
            updateDivideButton();
        } catch {
            alert('Could not read file. Make sure it is a valid player list JSON.');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function getOverallStats() {
    return {
        totalMembers: players.length,
        totalPower: players.reduce((sum, player) => sum + player.power, 0)
    };
}

function addPlayer() {
    const nameInput = document.getElementById('playerName');
    const powerInput = document.getElementById('playerPower');
    
    const name = nameInput.value.trim();
    const power = parseInt(powerInput.value, 10);
    
    if (!name) {
        alert('Please enter a player name!');
        return;
    }
    
    if (!power || power < 1) {
        alert('Please enter a valid power value (1 or higher)!');
        return;
    }
    
    players.push({ name, power });
    
    nameInput.value = '';
    powerInput.value = '';
    nameInput.focus();
    
    renderPlayersList();
    updateDivideButton();
}

function removePlayer(index) {
    players.splice(index, 1);
    renderPlayersList();
    updateDivideButton();
}

function editPlayer(index) {
    const player = players[index];
    const itemDiv = document.getElementById(`player-item-${index}`);
    if (!itemDiv) return;

    itemDiv.innerHTML = `
        <div class="player-inline-edit">
            <input type="text" id="edit-name-${index}" value="${player.name}" placeholder="Name">
            <input type="number" id="edit-power-${index}" value="${player.power}" min="1" placeholder="Power">
            <button onclick="savePlayer(${index})" class="btn btn-sm btn-success">Save</button>
            <button onclick="renderPlayersList()" class="btn btn-sm btn-outline-secondary">Cancel</button>
        </div>
    `;
    document.getElementById(`edit-name-${index}`).focus();
}

function savePlayer(index) {
    const nameInput = document.getElementById(`edit-name-${index}`);
    const powerInput = document.getElementById(`edit-power-${index}`);

    const name = nameInput.value.trim();
    const power = parseInt(powerInput.value, 10);

    if (!name) { alert('Name cannot be empty!'); return; }
    if (!power || power < 1) { alert('Please enter a valid power (1 or higher)!'); return; }

    players[index] = { name, power };
    renderPlayersList();
    updateDivideButton();
}

function renderPlayersList() {
    const listDiv = document.getElementById('playersList');
    const stats = getOverallStats();
    const statsHtml = `
        <div class="overall-stats">
            <span class="stat-chip">Total Members: <strong>${stats.totalMembers}</strong></span>
            <span class="stat-chip">Total Power: <strong>${stats.totalPower}</strong></span>
        </div>
    `;
    
    if (players.length === 0) {
        listDiv.innerHTML = `${statsHtml}<p class="empty-message">No players added yet.</p>`;
        return;
    }
    
    listDiv.innerHTML = `${statsHtml}<h3>Players Added:</h3>` + players.map((player, index) =>
        `<div class="player-item" id="player-item-${index}">
            <span class="player-info"><strong>${player.name}</strong> - Power: <span class="power-badge">${player.power}</span></span>
            <div class="player-item-actions">
                <button onclick="editPlayer(${index})" class="btn btn-sm btn-outline-primary">✏</button>
                <button onclick="removePlayer(${index})" class="btn btn-sm btn-outline-danger">✕</button>
            </div>
        </div>`
    ).join('');
}

function updateDivideButton() {
    const divideBtn = document.getElementById('divideBtn');
    divideBtn.disabled = players.length < 3;
}

function divideTeams() {
    if (players.length < 3) {
        alert('Need at least 3 players to divide into 3 teams!');
        return;
    }
    
    const teams = balanceTeams(players);
    window._lastTeams = teams;
    displayTeams(teams);
}

function balanceTeams(playerList) {
    const sorted = [...playerList].sort((a, b) => b.power - a.power);
    const teams = [[], [], []];
    const teamPowers = [0, 0, 0];
    
    sorted.forEach((player) => {
        const minTeamIndex = teamPowers.indexOf(Math.min(...teamPowers));
        teams[minTeamIndex].push(player);
        teamPowers[minTeamIndex] += player.power;
    });
    
    return teams.map((team, index) => ({
        name: `Team ${index + 1}`,
        players: team,
        totalPower: team.reduce((sum, p) => sum + p.power, 0),
        avgPower: team.length > 0 ? Math.round(team.reduce((sum, p) => sum + p.power, 0) / team.length) : 0
    }));
}

function displayTeams(teams) {
    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    
    const output = document.getElementById('teamsOutput');
    const teamColors = ['#4facfe', '#f093fb', '#43e97b'];
    const stats = getOverallStats();
    
    output.innerHTML = `
        <div class="overall-stats overall-stats-results">
            <span class="stat-chip">Total Members: <strong>${stats.totalMembers}</strong></span>
            <span class="stat-chip">Total Power: <strong>${stats.totalPower}</strong></span>
        </div>
    ` + teams.map((team, index) =>
        `<div class="team-card" style="border-left: 4px solid ${teamColors[index]}">
            <h3>${team.name}</h3>
            <p><strong>Members:</strong> ${team.players.length}</p>
            <p><strong>Total Power:</strong> <span class="power-total">${team.totalPower}</span></p>
            <p><strong>Avg Power:</strong> ${team.avgPower}</p>
            <div class="team-players">
                ${team.players.map(p => 
                    `<div class="team-player-item">
                        <span>${p.name}</span>
                        <span class="player-power">${p.power}</span>
                    </div>`
                ).join('')}
            </div>
        </div>`
    ).join('');
}

function editPlayerList() {
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('input-section').classList.remove('hidden');
    renderPlayersList();
    updateDivideButton();
}

function downloadResults() {
    const stats = getOverallStats();
    const lines = [];

    lines.push('Canyon Clash Team Assignments');
    lines.push('==============================');
    lines.push(`Total Members : ${stats.totalMembers}`);
    lines.push(`Total Power   : ${stats.totalPower}`);
    lines.push('');

    const lastTeams = window._lastTeams;
    if (!lastTeams) {
        return;
    }

    lastTeams.forEach((team) => {
        lines.push(`--- ${team.name} ---`);
        lines.push(`Members   : ${team.players.length}`);
        lines.push(`Total Power: ${team.totalPower}`);
        lines.push(`Avg Power  : ${team.avgPower}`);
        lines.push('');
        team.players.forEach((p) => {
            lines.push(`  ${p.name.padEnd(20)} ${p.power}`);
        });
        lines.push('');
    });

    lines.push('------------------------------');
    lines.push('Generated by wos.nhoktenz.com/canyon_clash');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canyon_clash_teams.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function resetPlayers() {
    players = [];
    document.getElementById('playerName').value = '';
    document.getElementById('playerPower').value = '';
    document.getElementById('playerName').focus();
    
    document.getElementById('input-section').classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');
    
    renderPlayersList();
    updateDivideButton();
}

// Initialize
renderPlayersList();
updateDivideButton();
