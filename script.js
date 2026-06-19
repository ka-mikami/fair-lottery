// UI Elements
const els = {
  // Tabs
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Mode selection
  modeTabs: document.getElementById('mode-tabs'),
  modeContents: document.querySelectorAll('.mode-content'),
  
  // Participants
  participantsText: document.getElementById('participants-text'),
  participantsNumber: document.getElementById('participants-number'),
  numDecrease: document.getElementById('num-decrease'),
  numIncrease: document.getElementById('num-increase'),
  participantCountDisplay: document.querySelectorAll('#participant-count-display, .participant-count-display'),
  
  // Roles
  rolesContainer: document.getElementById('roles-container'),
  addRoleBtn: document.getElementById('add-role-btn'),
  autoNumberBtn: document.getElementById('auto-number-btn'),
  totalRolesDisplay: document.getElementById('total-roles-display'),
  roleWarning: document.getElementById('role-warning'),
  
  // Seating Config
  seatingRows: document.getElementById('seating-rows'),
  seatingCols: document.getElementById('seating-cols'),
  autoSeatingBtn: document.getElementById('auto-seating-btn'),
  totalSeatsDisplay: document.getElementById('total-seats-display'),
  seatingWarning: document.getElementById('seating-warning'),
  
  // Option Settings
  weightToggle: document.getElementById('weight-toggle'),
  resetHistoryBtn: document.getElementById('reset-history-btn'),
  
  // Actions & Sections
  startBtn: document.getElementById('start-btn'),
  setupSection: document.getElementById('setup-section'),
  animationSection: document.getElementById('animation-section'),
  resultSection: document.getElementById('result-section'),
  
  // Results
  resultTitle: document.getElementById('result-title'),
  normalResultContainer: document.getElementById('normal-result-container'),
  seatingResultContainer: document.getElementById('seating-result-container'),
  resultList: document.getElementById('result-list'),
  seatingGrid: document.getElementById('seating-grid'),
  sortTabs: document.querySelectorAll('.sort-tab'),
  retryBtn: document.getElementById('retry-btn'),
  editBtn: document.getElementById('edit-btn')
};

// State
let state = {
  mode: 'normal', // 'normal' or 'seating'
  inputType: 'names-input', // 'names-input' or 'number-input'
  roles: [
    { id: 1, name: '当たり', count: 1 },
    { id: 2, name: 'ハズレ', count: 4 } // will be synced with participant count
  ],
  nextRoleId: 3,
  finalResult: [],
  finalSeatingResult: [], // for seating mode
  currentSort: 'random', // 'random', 'name', 'role'
  history: [], // Seating history: max 5 items
  useWeighting: false,
  selectedSeatIndex: null // for mobile tap-to-swap
};

// Initialize
function init() {
  // Load history from localStorage
  const savedHistory = localStorage.getItem('seatingHistory');
  if (savedHistory) {
    try {
      state.history = JSON.parse(savedHistory);
    } catch (e) {
      state.history = [];
    }
  }

  // Load toggle state from localStorage
  const savedWeighting = localStorage.getItem('seatingUseWeighting');
  if (savedWeighting !== null) {
    state.useWeighting = savedWeighting === 'true';
    if (els.weightToggle) {
      els.weightToggle.checked = state.useWeighting;
    }
  }

  bindEvents();
  renderRoles();
  updateParticipantCount();
}

function bindEvents() {
  // Mode selection tabs
  if (els.modeTabs) {
    const buttons = els.modeTabs.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mode = btn.dataset.mode;
        
        // Toggle setup forms
        els.modeContents.forEach(content => {
          content.classList.add('hidden-section');
        });
        document.getElementById(`${state.mode}-mode-content`).classList.remove('hidden-section');
        
        updateValidation();
      });
    });
  }

  // Tabs
  els.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      els.tabs.forEach(t => t.classList.remove('active'));
      els.tabContents.forEach(c => c.classList.add('hidden'));
      els.tabContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = tab.dataset.target;
      document.getElementById(targetId).classList.remove('hidden');
      document.getElementById(targetId).classList.add('active');
      state.inputType = targetId;
      updateParticipantCount();
    });
  });

  // Participant Inputs
  els.participantsText.addEventListener('input', updateParticipantCount);
  els.participantsNumber.addEventListener('input', updateParticipantCount);
  
  els.numDecrease.addEventListener('click', () => {
    els.participantsNumber.value = Math.max(2, parseInt(els.participantsNumber.value) - 1);
    updateParticipantCount();
  });
  els.numIncrease.addEventListener('click', () => {
    els.participantsNumber.value = Math.min(100, parseInt(els.participantsNumber.value) + 1);
    updateParticipantCount();
  });

  // Roles
  els.addRoleBtn.addEventListener('click', () => {
    state.roles.push({ id: state.nextRoleId++, name: '枠' + state.nextRoleId, count: 1 });
    renderRoles();
    updateValidation();
  });

  // Actions
  els.startBtn.addEventListener('click', startLottery);
  els.retryBtn.addEventListener('click', () => {
    els.resultSection.classList.replace('active-section', 'hidden-section');
    startLottery();
  });
  els.editBtn.addEventListener('click', () => {
    els.resultSection.classList.replace('active-section', 'hidden-section');
    els.setupSection.classList.replace('hidden-section', 'active-section');
  });

  // Auto Numbering
  els.autoNumberBtn.addEventListener('click', () => {
    const pCount = getParticipants().length;
    if (pCount === 0) {
      alert('先に参加者を入力または人数を指定してください。');
      return;
    }
    // Set roles to 1 to P
    state.roles = Array.from({ length: pCount }, (_, i) => ({
      id: i + 1,
      name: (i + 1).toString(),
      count: 1
    }));
    state.nextRoleId = pCount + 1;
    renderRoles();
    updateValidation();
  });

  // Seating inputs
  if (els.seatingRows && els.seatingCols) {
    els.seatingRows.addEventListener('input', updateValidation);
    els.seatingCols.addEventListener('input', updateValidation);
  }

  // Auto Seating calculation
  if (els.autoSeatingBtn) {
    els.autoSeatingBtn.addEventListener('click', () => {
      const pCount = getParticipants().length;
      if (pCount === 0) {
        alert('先に参加者を入力または人数を指定してください。');
        return;
      }
      
      // Calculate grid size
      let cols = 6;
      if (pCount <= 6) cols = pCount || 1;
      else if (pCount <= 12) cols = 4;
      else if (pCount <= 20) cols = 5;
      else cols = 6;

      let rows = Math.ceil(pCount / cols);
      
      els.seatingRows.value = rows;
      els.seatingCols.value = cols;
      updateValidation();
    });
  }

  // Sort Tabs
  els.sortTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      els.sortTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentSort = tab.dataset.sort;
      showResult();
    });
  });

  // Option Settings Events
  if (els.weightToggle) {
    els.weightToggle.addEventListener('change', e => {
      state.useWeighting = e.target.checked;
      localStorage.setItem('seatingUseWeighting', state.useWeighting);
    });
  }

  if (els.resetHistoryBtn) {
    els.resetHistoryBtn.addEventListener('click', () => {
      if (confirm('過去の座席履歴をすべて削除してもよろしいですか？（重み付けの基準がリセットされます）')) {
        state.history = [];
        localStorage.removeItem('seatingHistory');
        alert('履歴をリセットしました。');
      }
    });
  }
}

function getParticipants() {
  if (state.inputType === 'names-input') {
    return els.participantsText.value
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  } else {
    const num = parseInt(els.participantsNumber.value) || 0;
    return Array.from({ length: num }, (_, i) => `参加者 ${i + 1}`);
  }
}

function updateParticipantCount() {
  const count = getParticipants().length;
  els.participantCountDisplay.forEach(el => el.textContent = count);
  updateValidation();
}

function renderRoles() {
  els.rolesContainer.innerHTML = '';
  state.roles.forEach((role, index) => {
    const row = document.createElement('div');
    row.className = 'role-row';
    
    // Name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = role.name;
    nameInput.placeholder = '役割名';
    nameInput.addEventListener('input', e => {
      role.name = e.target.value;
    });

    // Count input
    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.min = '0';
    countInput.value = role.count;
    countInput.addEventListener('input', e => {
      role.count = parseInt(e.target.value) || 0;
      updateValidation();
    });

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-role-btn';
    removeBtn.innerHTML = '×';
    removeBtn.title = '削除';
    if (state.roles.length <= 1) removeBtn.style.opacity = '0.5';
    else {
      removeBtn.addEventListener('click', () => {
        state.roles.splice(index, 1);
        renderRoles();
        updateValidation();
      });
    }

    row.appendChild(nameInput);
    row.appendChild(countInput);
    row.appendChild(removeBtn);
    els.rolesContainer.appendChild(row);
  });
}

function updateValidation() {
  const pCount = getParticipants().length;
  els.participantCountDisplay.forEach(el => el.textContent = pCount);
  
  if (state.mode === 'normal') {
    const rCount = state.roles.reduce((sum, r) => sum + r.count, 0);
    els.totalRolesDisplay.textContent = rCount;
    
    if (pCount === 0) {
      els.roleWarning.textContent = '参加者が設定されていません。';
      els.startBtn.disabled = true;
      els.startBtn.style.opacity = '0.5';
    } else if (pCount < rCount) {
      els.roleWarning.textContent = `参加者(${pCount}人)より役割(${rCount}個)が多すぎます！`;
      els.startBtn.disabled = true;
      els.startBtn.style.opacity = '0.5';
    } else if (pCount > rCount) {
      els.roleWarning.textContent = `役割が ${pCount - rCount} 個不足しています。余った人は自動で「その他」になります。`;
      els.startBtn.disabled = false;
      els.startBtn.style.opacity = '1';
    } else {
      els.roleWarning.textContent = '';
      els.startBtn.disabled = false;
      els.startBtn.style.opacity = '1';
    }
  } else {
    // Seating mode validation
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    const seats = rows * cols;
    els.totalSeatsDisplay.textContent = seats;
    
    if (pCount === 0) {
      els.seatingWarning.textContent = '参加者が設定されていません。';
      els.startBtn.disabled = true;
      els.startBtn.style.opacity = '0.5';
    } else if (pCount > seats) {
      els.seatingWarning.textContent = `席数(${seats}席)が足りません！参加者(${pCount}人)が入るよう、行または列を増やしてください。`;
      els.startBtn.disabled = true;
      els.startBtn.style.opacity = '0.5';
    } else {
      const emptyCount = seats - pCount;
      els.seatingWarning.textContent = emptyCount > 0 ? `空席が ${emptyCount} 席できます。` : '';
      els.startBtn.disabled = false;
      els.startBtn.style.opacity = '1';
    }
  }
}

// Fisher-Yates shuffle using crypto API for true randomness
function secureShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    // Generate a random index between 0 and i inclusive
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const randomNumber = randomBuffer[0] / (0xffffffff + 1);
    const j = Math.floor(randomNumber * (i + 1));
    
    // Swap elements
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getZoneOfSeat(seatIdx, rows, cols) {
  const row = Math.floor(seatIdx / cols);
  const zoneSize = rows / 3;
  if (row < Math.round(zoneSize)) return 'front';
  if (row < Math.round(zoneSize * 2)) return 'middle';
  return 'back';
}

function calculateSeatScore(person, seatIdx, zone, lastSeatingMap, historySummary) {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const rand = randomBuffer[0] / 0xffffffff;
  let score = rand * 10; // Base random score 0 to 10
  
  // 1. Avoid placing on the same seat as the last time
  if (lastSeatingMap && lastSeatingMap[person] === seatIdx) {
    score -= 1000;
  }
  
  // 2. Adjust weight based on history
  const summary = historySummary[person];
  if (summary) {
    if (zone === 'front') {
      score -= summary.frontCount * 3.5;
      score += summary.backCount * 2.0;
    } else if (zone === 'back') {
      score -= summary.backCount * 3.5;
      score += summary.frontCount * 2.0;
    }
  }
  
  return score;
}

function saveSeatingResultToHistory(rows, cols) {
  const result = [];
  state.finalSeatingResult.forEach((person, idx) => {
    if (person) {
      result.push({
        name: person,
        seatIndex: idx,
        zone: getZoneOfSeat(idx, rows, cols)
      });
    }
  });
  
  const newEvent = {
    timestamp: Date.now(),
    rows: rows,
    cols: cols,
    result: result
  };
  
  state.history.push(newEvent);
  
  // Keep only the last 5 results (FIFO)
  while (state.history.length > 5) {
    state.history.shift();
  }
  
  localStorage.setItem('seatingHistory', JSON.stringify(state.history));
}

function startLottery() {
  state.selectedSeatIndex = null; // Reset selection state
  const participants = getParticipants();
  if (participants.length === 0) return;

  if (state.mode === 'normal') {
    // Build roles array
    let rolePool = [];
    state.roles.forEach(role => {
      for (let i = 0; i < role.count; i++) {
         rolePool.push(role.name || '名無し役割');
      }
    });

    // Fill remaining slots with default role
    while (rolePool.length < participants.length) {
      rolePool.push('その他');
    }

    // Slice if there are somehow too many roles (should be caught by validation)
    if (rolePool.length > participants.length) {
      rolePool = rolePool.slice(0, participants.length);
    }

    // Shuffle roles and participants to ensure fairness
    const shuffledParticipants = secureShuffle(participants);
    const shuffledRoles = secureShuffle(rolePool);

    // Pair them up
    state.finalResult = shuffledParticipants.map((p, i) => ({
      name: p,
      role: shuffledRoles[i]
    }));
  } else {
    // Seating mode lottery
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    const totalSeats = rows * cols;
    
    // Initialize seat mapping
    state.finalSeatingResult = Array.from({ length: totalSeats }, () => null);

    if (state.useWeighting && state.history.length > 0) {
      // WEIGHTED SHUFFLE LOGIC
      // 1. Get last seating layout mapping
      const lastSeatingMap = {};
      const lastEvent = state.history[state.history.length - 1];
      if (lastEvent) {
        lastEvent.result.forEach(r => {
          lastSeatingMap[r.name] = r.seatIndex;
        });
      }
      
      // 2. Summarize seating counts in history
      const historySummary = {};
      participants.forEach(p => {
        historySummary[p] = { frontCount: 0, middleCount: 0, backCount: 0 };
      });
      
      state.history.forEach(event => {
        event.result.forEach(r => {
          if (historySummary[r.name]) {
            if (r.zone === 'front') historySummary[r.name].frontCount++;
            else if (r.zone === 'middle') historySummary[r.name].middleCount++;
            else if (r.zone === 'back') historySummary[r.name].backCount++;
          }
        });
      });
      
      // 3. Place participants seat by seat
      const remainingParticipants = [...participants];
      
      for (let seatIdx = 0; seatIdx < totalSeats; seatIdx++) {
        if (seatIdx >= participants.length) break; // Fill front seats only (front-packing)
        
        const zone = getZoneOfSeat(seatIdx, rows, cols);
        
        let bestIdx = -1;
        let bestScore = -Infinity;
        
        for (let i = 0; i < remainingParticipants.length; i++) {
          const person = remainingParticipants[i];
          const score = calculateSeatScore(person, seatIdx, zone, lastSeatingMap, historySummary);
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
        
        if (bestIdx !== -1) {
          state.finalSeatingResult[seatIdx] = remainingParticipants[bestIdx];
          remainingParticipants.splice(bestIdx, 1);
        }
      }
    } else {
      // SIMPLE RANDOM SHUFFLE
      // Shuffle the participants
      const shuffledParticipants = secureShuffle(participants);
      
      // Place participants in the front seats (0 to P - 1)
      shuffledParticipants.forEach((person, index) => {
        state.finalSeatingResult[index] = person;
      });
    }
    
    // Save this seating result to history
    saveSeatingResultToHistory(rows, cols);
  }

  // UI transition
  els.setupSection.classList.replace('active-section', 'hidden-section');
  els.animationSection.classList.replace('hidden-section', 'active-section');

  // Reset sort tabs
  state.currentSort = 'random';
  els.sortTabs.forEach(tab => {
    if (tab.dataset.sort === 'random') {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // After animation, show result
  setTimeout(() => {
    els.animationSection.classList.replace('active-section', 'hidden-section');
    showResult();
  }, 2500); // 2.5 seconds shuffling
}

function showResult() {
  if (state.mode === 'normal') {
    els.resultTitle.textContent = '抽選結果';
    els.normalResultContainer.classList.remove('hidden-section');
    els.seatingResultContainer.classList.add('hidden-section');
    
    els.resultList.innerHTML = '';
    
    // Determine if a role is "special" (like '当たり' or just not 'ハズレ' / 'その他')
    const defaultNormalRoles = ['ハズレ', 'はずれ', 'その他', 'なし'];

    // Apply sorting
    let displayResults = [...state.finalResult];
    if (state.currentSort === 'name') {
      displayResults.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    } else if (state.currentSort === 'role') {
      displayResults.sort((a, b) => {
        const parsedA = parseInt(a.role);
        const parsedB = parseInt(b.role);
        if (!isNaN(parsedA) && !isNaN(parsedB)) {
          return parsedA - parsedB;
        }
        return a.role.localeCompare(b.role, 'ja');
      });
    }

    displayResults.forEach((res, index) => {
      const li = document.createElement('li');
      li.className = 'result-item';
      
      const isSpecial = !defaultNormalRoles.includes(res.role) && isNaN(parseInt(res.role));
      if (isSpecial) li.classList.add('highlight');
      
      // add small stagger to animation
      li.style.animationDelay = `${index * 0.04}s`;

      li.innerHTML = `
        <span class="result-name" title="${escapeHTML(res.name)}">${escapeHTML(res.name)}</span>
        <span class="result-role">${escapeHTML(res.role)}</span>
      `;
      els.resultList.appendChild(li);
    });
  } else {
    // Seating result rendering
    els.resultTitle.textContent = '座席配置';
    els.normalResultContainer.classList.add('hidden-section');
    els.seatingResultContainer.classList.remove('hidden-section');
    
    els.seatingGrid.innerHTML = '';
    
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    
    els.seatingGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    state.finalSeatingResult.forEach((person, idx) => {
      const seatDiv = document.createElement('div');
      seatDiv.className = 'seat';
      seatDiv.setAttribute('draggable', 'true');
      seatDiv.dataset.index = idx;
      
      // Stagger by grid distance
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      seatDiv.style.animationDelay = `${(r + c) * 0.05}s`;
      
      if (person) {
        seatDiv.classList.add('occupied');
        seatDiv.title = person; // Full name tooltip on hover
        seatDiv.innerHTML = `
          <span class="seat-number">席 ${idx + 1}</span>
          <span class="seat-name" title="${escapeHTML(person)}">${escapeHTML(person)}</span>
        `;
      } else {
        seatDiv.classList.add('empty');
        seatDiv.title = '空席';
        seatDiv.innerHTML = `
          <span class="seat-number">席 ${idx + 1}</span>
          <span class="seat-name">空席</span>
        `;
      }

      // Drag & Drop Events
      seatDiv.addEventListener('dragstart', handleDragStart);
      seatDiv.addEventListener('dragover', handleDragOver);
      seatDiv.addEventListener('dragenter', handleDragEnter);
      seatDiv.addEventListener('dragleave', handleDragLeave);
      seatDiv.addEventListener('drop', handleDrop);
      seatDiv.addEventListener('dragend', handleDragEnd);

      // Tap-to-Swap Click Event
      seatDiv.addEventListener('click', handleSeatClick);

      els.seatingGrid.appendChild(seatDiv);
    });
  }

  els.resultSection.classList.replace('hidden-section', 'active-section');
}

// Seating Swap Logic
function swapSeats(draggedIndex, targetIndex) {
  if (draggedIndex !== null && draggedIndex !== targetIndex) {
    // Swap elements in State
    const temp = state.finalSeatingResult[draggedIndex];
    state.finalSeatingResult[draggedIndex] = state.finalSeatingResult[targetIndex];
    state.finalSeatingResult[targetIndex] = temp;
    
    // Swap contents in DOM
    const sourceSeat = document.querySelector(`.seat[data-index="${draggedIndex}"]`);
    const targetSeat = document.querySelector(`.seat[data-index="${targetIndex}"]`);
    
    if (sourceSeat && targetSeat) {
      const sourceHTML = sourceSeat.innerHTML;
      const sourceOccupied = sourceSeat.classList.contains('occupied');
      const sourceEmpty = sourceSeat.classList.contains('empty');
      const sourceTitle = sourceSeat.title || '';
      
      sourceSeat.innerHTML = targetSeat.innerHTML;
      sourceSeat.classList.toggle('occupied', targetSeat.classList.contains('occupied'));
      sourceSeat.classList.toggle('empty', targetSeat.classList.contains('empty'));
      sourceSeat.title = targetSeat.title || '';
      
      targetSeat.innerHTML = sourceHTML;
      targetSeat.classList.toggle('occupied', sourceOccupied);
      targetSeat.classList.toggle('empty', sourceEmpty);
      targetSeat.title = sourceTitle;
    }
    
    // Sync with seating history
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    updateHistoryAfterSwap(rows, cols);
  }
}

function updateHistoryAfterSwap(rows, cols) {
  if (state.history.length === 0) return;
  
  const result = [];
  state.finalSeatingResult.forEach((person, idx) => {
    if (person) {
      result.push({
        name: person,
        seatIndex: idx,
        zone: getZoneOfSeat(idx, rows, cols)
      });
    }
  });
  
  // Update the latest event in history
  state.history[state.history.length - 1].result = result;
  localStorage.setItem('seatingHistory', JSON.stringify(state.history));
}

// Drag and Drop Event Handlers
let draggedIndex = null;

function handleDragStart(e) {
  draggedIndex = parseInt(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedIndex);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  return false;
}

function handleDragEnter(e) {
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over');
  
  const targetIndex = parseInt(this.dataset.index);
  swapSeats(draggedIndex, targetIndex);
  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.seat').forEach(s => s.classList.remove('drag-over'));
  draggedIndex = null;
}

// Tap-to-Swap Event Handler
function handleSeatClick() {
  const clickedIndex = parseInt(this.dataset.index);
  
  if (state.selectedSeatIndex === null) {
    // First seat selected
    state.selectedSeatIndex = clickedIndex;
    this.classList.add('selected');
  } else if (state.selectedSeatIndex === clickedIndex) {
    // Clicked the same seat, deselect
    state.selectedSeatIndex = null;
    this.classList.remove('selected');
  } else {
    // Second seat selected, perform swap
    const sourceIndex = state.selectedSeatIndex;
    const targetIndex = clickedIndex;
    
    const sourceSeat = document.querySelector(`.seat[data-index="${sourceIndex}"]`);
    if (sourceSeat) {
      sourceSeat.classList.remove('selected');
    }
    
    state.selectedSeatIndex = null;
    swapSeats(sourceIndex, targetIndex);
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])
  );
}

// Start
init();
