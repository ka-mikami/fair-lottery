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
  participantsHistorySelect: document.getElementById('participants-history-select'),
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
  priorityMembersList: document.getElementById('priority-members-list'),
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
  editBtn: document.getElementById('edit-btn'),
  homeBtn: document.getElementById('home-btn')
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
  participantsHistory: [], // Participants text history: max 5 items
  normalHistory: [], // Normal lottery history: max 5 items
  useWeighting: false,
  selectedSeatIndex: null // for mobile tap-to-swap
};

// Initialize
function init() {
  // Load history from localStorage
  try {
    const savedHistory = localStorage.getItem('seatingHistory');
    if (savedHistory) {
      state.history = JSON.parse(savedHistory);
    }
  } catch (e) {
    state.history = [];
  }

  // Load participants text history
  try {
    const savedParticipantsHistory = localStorage.getItem('participantsTextHistory');
    if (savedParticipantsHistory) {
      state.participantsHistory = JSON.parse(savedParticipantsHistory);
    }
  } catch (e) {
    state.participantsHistory = [];
  }

  // Load normal lottery history
  try {
    const savedNormalHistory = localStorage.getItem('normalLotteryHistory');
    if (savedNormalHistory) {
      state.normalHistory = JSON.parse(savedNormalHistory);
    }
  } catch (e) {
    state.normalHistory = [];
  }

  // Load toggle state from localStorage
  try {
    const savedWeighting = localStorage.getItem('seatingUseWeighting');
    if (savedWeighting !== null) {
      state.useWeighting = savedWeighting === 'true';
      if (els.weightToggle) {
        els.weightToggle.checked = state.useWeighting;
      }
    }
  } catch (e) {
    state.useWeighting = false;
  }

  // Load saved mode from localStorage
  try {
    const savedMode = localStorage.getItem('lotteryMode');
    if (savedMode === 'normal' || savedMode === 'seating') {
      state.mode = savedMode;
    }
  } catch (e) {}

  bindEvents();
  
  // Sync UI to the loaded mode
  if (els.modeTabs) {
    const btn = els.modeTabs.querySelector(`button[data-mode="${state.mode}"]`);
    if (btn) btn.click();
  }
  
  updateParticipantsHistorySelect();
  updateResultsHistoryList();
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
        
        try {
          localStorage.setItem('lotteryMode', state.mode);
        } catch (err) {}
        
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
  if (els.homeBtn) {
    els.homeBtn.addEventListener('click', resetToHome);
  }

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
      try {
        localStorage.setItem('seatingUseWeighting', state.useWeighting);
      } catch (err) {}
    });
  }

  if (els.resetHistoryBtn) {
    els.resetHistoryBtn.addEventListener('click', () => {
      if (confirm('過去のすべての結果履歴（くじ引き・席替え）を削除してもよろしいですか？（偏り防止の基準もリセットされます）')) {
        state.history = [];
        state.normalHistory = [];
        try {
          localStorage.removeItem('seatingHistory');
          localStorage.removeItem('normalLotteryHistory');
        } catch (err) {}
        updateResultsHistoryList();
        alert('履歴をリセットしました。');
      }
    });
  }

  // IME composition helper for auto-furigana assistant (supports multi-step typing like Lastname -> Firstname)
  let lastKana = '';
  let currentLineIndex = -1;
  let lineKanjiBuffer = [];
  let lineYomiBuffer = [];
  let isComposing = false;

  function getLineIndex(textarea) {
    const pos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.slice(0, pos);
    return textBeforeCursor.split('\n').length - 1;
  }

  function commitFuriganaForLine(lineIdx) {
    if (lineIdx < 0 || lineKanjiBuffer.length === 0) return;
    
    const textarea = els.participantsText;
    const lines = textarea.value.split('\n');
    if (lineIdx >= lines.length) return;
    
    const lineText = lines[lineIdx];
    
    // Skip if the line already contains furigana in parentheses
    if (/[（(][^）)]+[）)]/.test(lineText)) {
      lineKanjiBuffer = [];
      lineYomiBuffer = [];
      return;
    }
    
    // Ensure all typed parts are still present on the current line
    const allKanjiPresent = lineKanjiBuffer.every(k => lineText.includes(k));
    
    if (allKanjiPresent) {
      const hasSpace = /[\s　]/.test(lineText);
      const joinedYomi = lineYomiBuffer.join(hasSpace ? ' ' : '');
      const newLineText = lineText + `(${joinedYomi})`;
      
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      
      lines[lineIdx] = newLineText;
      textarea.value = lines.join('\n');
      
      const addedLength = newLineText.length - lineText.length;
      textarea.selectionStart = startPos + addedLength;
      textarea.selectionEnd = endPos + addedLength;
      
      updateParticipantCount();
    }
    
    lineKanjiBuffer = [];
    lineYomiBuffer = [];
  }

  if (els.participantsText) {
    const textarea = els.participantsText;

    textarea.addEventListener('compositionstart', () => {
      isComposing = true;
      lastKana = '';
    });

    textarea.addEventListener('compositionupdate', (e) => {
      const text = e.data || '';
      // Allow Hiragana, Katakana, Roman/Alpha during typing, spaces, and prolonged sound marks
      const isKanaOrAlpha = /^[\u3040-\u309f\u30a0-\u30ff\uFF65-\uFF9F\u30fc\sA-Za-zａ-ｚＡ-Ｚ]*$/.test(text);
      if (isKanaOrAlpha && text.trim().length > 0) {
        lastKana = text;
      }
    });

    textarea.addEventListener('compositionend', (e) => {
      isComposing = false;
      const determinedText = e.data || '';
      const hasKanji = /[\u4e00-\u9faf\u3400-\u4dbf\u3005]/.test(determinedText);
      
      if (hasKanji && lastKana && determinedText !== lastKana) {
        const lineIdx = getLineIndex(textarea);
        
        // If line changed, commit/clear previous line first
        if (lineIdx !== currentLineIndex) {
          commitFuriganaForLine(currentLineIndex);
          currentLineIndex = lineIdx;
        }
        
        lineKanjiBuffer.push(determinedText);
        lineYomiBuffer.push(katakanaToHiragana(lastKana.trim()));
      }
      lastKana = '';
    });

    // Commit furigana when pressing Enter key (moving to next line)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !isComposing) {
        commitFuriganaForLine(currentLineIndex);
      }
    });

    // Detect cursor or click movements changing the current editing line
    const checkLineChange = () => {
      const lineIdx = getLineIndex(textarea);
      if (lineIdx !== currentLineIndex) {
        commitFuriganaForLine(currentLineIndex);
        currentLineIndex = lineIdx;
      }
    };

    textarea.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
        checkLineChange();
      }
    });

    textarea.addEventListener('click', checkLineChange);
    textarea.addEventListener('blur', () => {
      commitFuriganaForLine(currentLineIndex);
      currentLineIndex = -1;
    });
  }

  // Participants History selection
  if (els.participantsHistorySelect) {
    els.participantsHistorySelect.addEventListener('change', (e) => {
      const idx = e.target.value;
      if (idx !== '') {
        const historyItem = state.participantsHistory[parseInt(idx)];
        if (historyItem) {
          if (els.participantsText.value.trim() !== '' && !confirm('現在の入力内容が履歴の内容で上書きされます。よろしいですか？')) {
            e.target.value = '';
            return;
          }
          els.participantsText.value = historyItem.text;
          updateParticipantCount();
          e.target.value = '';
        }
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

function renderPriorityMembers() {
  if (!els.priorityMembersList) return;
  
  // 1. Save currently checked members
  const checkedMembers = new Set();
  els.priorityMembersList.querySelectorAll('input:checked').forEach(cb => {
    checkedMembers.add(cb.value);
  });
  
  // 2. Get current participants list
  const participants = getParticipants();
  
  els.priorityMembersList.innerHTML = '';
  
  if (participants.length === 0) {
    els.priorityMembersList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem; grid-column: 1 / -1; text-align: center; margin: 0.5rem 0;">参加者を設定するとここにメンバーが表示されます</p>';
    return;
  }
  
  participants.forEach(name => {
    const label = document.createElement('label');
    label.style.cssText = 'display: flex; align-items: center; gap: 0.4rem; color: #fff; font-size: 0.85rem; cursor: pointer; background: rgba(255,255,255,0.03); padding: 0.3rem 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; white-space: nowrap; text-overflow: ellipsis;';
    label.title = name;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'priority-member-checkbox';
    checkbox.value = name;
    if (checkedMembers.has(name)) {
      checkbox.checked = true;
    }
    
    // UI improvement: Change style on check
    checkbox.addEventListener('change', () => {
      label.style.background = checkbox.checked ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.03)';
      label.style.borderColor = checkbox.checked ? '#ec4899' : 'rgba(255,255,255,0.05)';
    });
    
    if (checkbox.checked) {
      label.style.background = 'rgba(236,72,153,0.15)';
      label.style.borderColor = '#ec4899';
    }
    
    const span = document.createElement('span');
    span.textContent = getDisplayName(name);
    span.style.cssText = 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    
    label.appendChild(checkbox);
    label.appendChild(span);
    els.priorityMembersList.appendChild(label);
  });
}

function updateParticipantCount() {
  const count = getParticipants().length;
  els.participantCountDisplay.forEach(el => el.textContent = count);
  renderPriorityMembers();
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
  
  try {
    localStorage.setItem('seatingHistory', JSON.stringify(state.history));
  } catch (err) {}
}

function startLottery() {
  state.selectedSeatIndex = null; // Reset selection state
  
  // Save participants list to history
  saveParticipantsTextToHistory();
  
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

    // Save normal lottery result to history
    saveNormalLotteryToHistory();
  } else {
    // Seating mode lottery
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    const totalSeats = rows * cols;
    
    // Initialize seat mapping
    state.finalSeatingResult = Array.from({ length: totalSeats }, () => null);

    // 1. Get priority members (checked ones)
    const priorityMembers = [];
    document.querySelectorAll('.priority-member-checkbox:checked').forEach(cb => {
      priorityMembers.push(cb.value);
    });

    // 2. Identify priority seats (Front 2 rows: row < 2)
    // If rows <= 2, prioritize row < 1 (front 1 row). If rows === 1, prioritize the whole row.
    const priorityLimitRow = rows <= 2 ? 1 : 2;
    const prioritySeats = [];
    const regularSeats = [];
    
    for (let seatIdx = 0; seatIdx < totalSeats; seatIdx++) {
      if (seatIdx >= participants.length) continue; // Only consider occupied seats (front-packing)
      
      const row = Math.floor(seatIdx / cols);
      if (row < priorityLimitRow) {
        prioritySeats.push(seatIdx);
      } else {
        regularSeats.push(seatIdx);
      }
    }

    // 3. Shuffle priority members and assign them to randomly selected priority seats
    const shuffledPriorityMembers = secureShuffle(priorityMembers);
    const shuffledPrioritySeats = secureShuffle(prioritySeats);
    
    const assignedPriorityCount = Math.min(shuffledPriorityMembers.length, shuffledPrioritySeats.length);
    
    for (let i = 0; i < assignedPriorityCount; i++) {
      const seatIdx = shuffledPrioritySeats[i];
      const person = shuffledPriorityMembers[i];
      state.finalSeatingResult[seatIdx] = person;
    }

    // If there are more priority members than priority seats, the remaining priority members become regular
    const remainingPriorityMembers = shuffledPriorityMembers.slice(assignedPriorityCount);
    
    // 4. Gather remaining participants and seats
    const remainingParticipants = participants.filter(p => !priorityMembers.includes(p) || remainingPriorityMembers.includes(p));
    const remainingSeats = [
      ...shuffledPrioritySeats.slice(assignedPriorityCount), // unused priority seats (if any)
      ...regularSeats
    ].sort((a, b) => a - b); // Keep front-packing order

    // 5. Place remaining participants using weighted or simple random shuffle
    if (state.useWeighting && state.history.length > 0) {
      // WEIGHTED SHUFFLE FOR REMAINING
      const lastSeatingMap = {};
      const lastEvent = state.history[state.history.length - 1];
      if (lastEvent) {
        lastEvent.result.forEach(r => {
          lastSeatingMap[r.name] = r.seatIndex;
        });
      }
      
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

      const tempParticipants = [...remainingParticipants];
      
      remainingSeats.forEach(seatIdx => {
        const zone = getZoneOfSeat(seatIdx, rows, cols);
        
        let bestIdx = -1;
        let bestScore = -Infinity;
        
        for (let i = 0; i < tempParticipants.length; i++) {
          const person = tempParticipants[i];
          const score = calculateSeatScore(person, seatIdx, zone, lastSeatingMap, historySummary);
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
        
        if (bestIdx !== -1) {
          state.finalSeatingResult[seatIdx] = tempParticipants[bestIdx];
          tempParticipants.splice(bestIdx, 1);
        }
      });
    } else {
      // SIMPLE RANDOM SHUFFLE FOR REMAINING
      const shuffledRemaining = secureShuffle(remainingParticipants);
      remainingSeats.forEach((seatIdx, idx) => {
        if (idx < shuffledRemaining.length) {
          state.finalSeatingResult[seatIdx] = shuffledRemaining[idx];
        }
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
      displayResults.sort((a, b) => {
        const yomiA = getYomigana(a.name);
        const yomiB = getYomigana(b.name);
        return yomiA.localeCompare(yomiB, 'ja');
      });
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
        <span class="result-name" title="${escapeHTML(res.name)}">${escapeHTML(getDisplayName(res.name))}</span>
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
          <span class="seat-name" title="${escapeHTML(person)}">${escapeHTML(getDisplayName(person))}</span>
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
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedIndex);
  
  // Use setTimeout to ensure the browser takes the drag ghost snapshot 
  // before we apply the semi-transparent '.dragging' style to the original element.
  setTimeout(() => {
    this.classList.add('dragging');
  }, 0);
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

function katakanaToHiragana(str) {
  return str.replace(/[\u30a1-\u30f6]/g, match => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

function getYomigana(name) {
  const match = name.match(/[（(]([^）)]+)[）)]/);
  if (match) {
    return katakanaToHiragana(match[1].trim().toLowerCase());
  }
  return katakanaToHiragana(name.trim().toLowerCase());
}

function getDisplayName(name) {
  return name.replace(/[（(][^）)]+[）)]/g, '').trim();
}

function updateParticipantsHistorySelect() {
  const select = els.participantsHistorySelect;
  if (!select) return;
  
  select.innerHTML = '<option value="">-- 履歴から読み込む --</option>';
  
  if (!state.participantsHistory || state.participantsHistory.length === 0) {
    select.style.display = 'none';
    return;
  }
  
  select.style.display = 'block';
  
  state.participantsHistory.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = index.toString();
    
    const lines = item.text.split('\n').map(n => getDisplayName(n)).filter(n => n.length > 0);
    const count = lines.length;
    const summary = lines.slice(0, 3).join(', ') + (count > 3 ? '...' : '');
    
    const date = new Date(item.timestamp);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    option.textContent = `${summary} (計${count}人) - ${dateStr}`;
    select.appendChild(option);
  });
}

function saveParticipantsTextToHistory() {
  if (state.inputType !== 'names-input') return;
  
  const text = els.participantsText.value.trim();
  if (text.length === 0) return;
  
  if (!state.participantsHistory) {
    state.participantsHistory = [];
  }
  
  const existingIdx = state.participantsHistory.findIndex(h => h.text === text);
  if (existingIdx !== -1) {
    state.participantsHistory.splice(existingIdx, 1);
  }
  
  state.participantsHistory.unshift({
    text: text,
    timestamp: Date.now()
  });
  
  if (state.participantsHistory.length > 5) {
    state.participantsHistory.pop();
  }
  
  try {
    localStorage.setItem('participantsTextHistory', JSON.stringify(state.participantsHistory));
  } catch (err) {}
  updateParticipantsHistorySelect();
}

function resetToHome() {
  if (!confirm('入力データや現在の設定をすべてリセットしてホーム画面に戻ります。よろしいですか？')) {
    return;
  }

  // 1. Clear participant inputs
  els.participantsText.value = '';
  els.participantsNumber.value = 5;
  
  // 2. Clear tab targets
  state.inputType = 'names-input';
  document.querySelectorAll('.tab[data-target]').forEach(tab => {
    if (tab.dataset.target === 'names-input') tab.classList.add('active');
    else tab.classList.remove('active');
  });
  
  const namesInput = document.getElementById('names-input');
  const numberInput = document.getElementById('number-input');
  if (namesInput && numberInput) {
    namesInput.classList.remove('hidden');
    namesInput.classList.add('active');
    numberInput.classList.remove('active');
    numberInput.classList.add('hidden');
  }

  // 3. Reset roles to default
  state.roles = [
    { id: 1, name: '当たり', count: 1 },
    { id: 2, name: 'ハズレ', count: 4 }
  ];
  state.nextRoleId = 3;
  renderRoles();

  // 4. Reset seating size to default
  if (els.seatingRows && els.seatingCols) {
    els.seatingRows.value = 5;
    els.seatingCols.value = 6;
  }
  
  // 5. Clear selected priority members
  if (els.priorityMembersList) {
    els.priorityMembersList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  }

  // 6. Update counts and warnings
  updateParticipantCount();
  updateResultsHistoryList();
  
  // 7. Reset results and sorting states
  state.finalResult = [];
  state.finalSeatingResult = [];
  state.currentSort = 'random';
  state.selectedSeatIndex = null;
  
  // 8. Navigate back to setup section
  els.resultSection.classList.replace('active-section', 'hidden-section');
  els.setupSection.classList.replace('hidden-section', 'active-section');
}

function saveNormalLotteryToHistory() {
  const newEvent = {
    timestamp: Date.now(),
    result: [...state.finalResult]
  };
  
  if (!state.normalHistory) {
    state.normalHistory = [];
  }
  
  state.normalHistory.push(newEvent);
  
  while (state.normalHistory.length > 5) {
    state.normalHistory.shift();
  }
  
  try {
    localStorage.setItem('normalLotteryHistory', JSON.stringify(state.normalHistory));
  } catch (e) {}
  
  updateResultsHistoryList();
}

function updateResultsHistoryList() {
  const normalContainer = document.getElementById('normal-history-list');
  const seatingContainer = document.getElementById('seating-history-list');
  
  // Update normal lottery history
  if (normalContainer) {
    normalContainer.innerHTML = '';
    if (!state.normalHistory || state.normalHistory.length === 0) {
      normalContainer.innerHTML = '<p class="hint" style="text-align: center; padding: 1rem 0;">履歴はありません</p>';
    } else {
      // Show newest first
      [...state.normalHistory].reverse().forEach((h, revIndex) => {
        const index = state.normalHistory.length - 1 - revIndex;
        
        const row = document.createElement('div');
        row.className = 'history-item-row';
        
        const date = new Date(h.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        const roles = h.result.map(r => r.role);
        const uniqueRoles = [...new Set(roles)].filter(r => r !== 'その他');
        const roleSummary = uniqueRoles.slice(0, 2).join(', ') + (uniqueRoles.length > 2 ? '...' : '');
        
        row.innerHTML = `
          <div class="history-item-info">
            <span class="history-item-time">${dateStr}</span>
            <span>参加者: ${h.result.length}人 ${roleSummary ? `(${roleSummary})` : ''}</span>
          </div>
          <button class="history-item-btn" onclick="loadNormalHistory(${index})">結果を見る</button>
        `;
        normalContainer.appendChild(row);
      });
    }
  }
  
  // Update seating history
  if (seatingContainer) {
    seatingContainer.innerHTML = '';
    if (!state.history || state.history.length === 0) {
      seatingContainer.innerHTML = '<p class="hint" style="text-align: center; padding: 1rem 0;">履歴はありません</p>';
    } else {
      // Show newest first
      [...state.history].reverse().forEach((h, revIndex) => {
        const index = state.history.length - 1 - revIndex;
        
        const row = document.createElement('div');
        row.className = 'history-item-row';
        
        const date = new Date(h.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        row.innerHTML = `
          <div class="history-item-info">
            <span class="history-item-time">${dateStr}</span>
            <span>配置: ${h.rows}行×${h.cols}列 (計${h.result.length}人)</span>
          </div>
          <button class="history-item-btn" onclick="loadSeatingHistory(${index})">結果を見る</button>
        `;
        seatingContainer.appendChild(row);
      });
    }
  }
}

function loadNormalHistoryItem(index) {
  if (!state.normalHistory || !state.normalHistory[index]) return;
  const item = state.normalHistory[index];
  
  state.finalResult = item.result;
  state.mode = 'normal';
  
  // Sync UI tab
  if (els.modeTabs) {
    const btn = els.modeTabs.querySelector('button[data-mode="normal"]');
    if (btn) {
      els.modeTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }
  
  els.setupSection.classList.replace('active-section', 'hidden-section');
  els.resultSection.classList.replace('hidden-section', 'active-section');
  showResult();
  
  // Overwrite title for history view
  const date = new Date(item.timestamp);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  els.resultTitle.innerHTML = `抽選結果 <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); margin-left: 0.5rem; background: rgba(255,255,255,0.08); padding: 0.2rem 0.5rem; border-radius: 6px;">${dateStr} の履歴</span>`;
}

function loadSeatingHistoryItem(index) {
  if (!state.history || !state.history[index]) return;
  const item = state.history[index];
  
  const rows = item.rows;
  const cols = item.cols;
  
  if (els.seatingRows && els.seatingCols) {
    els.seatingRows.value = rows;
    els.seatingCols.value = cols;
  }
  
  const totalSeats = rows * cols;
  state.finalSeatingResult = Array.from({ length: totalSeats }, () => null);
  item.result.forEach(r => {
    state.finalSeatingResult[r.seatIndex] = r.name;
  });
  
  state.mode = 'seating';
  
  // Sync UI tab
  if (els.modeTabs) {
    const btn = els.modeTabs.querySelector('button[data-mode="seating"]');
    if (btn) {
      els.modeTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }
  
  els.setupSection.classList.replace('active-section', 'hidden-section');
  els.resultSection.classList.replace('hidden-section', 'active-section');
  showResult();
  
  // Overwrite title for history view
  const date = new Date(item.timestamp);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  els.resultTitle.innerHTML = `座席配置 <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); margin-left: 0.5rem; background: rgba(255,255,255,0.08); padding: 0.2rem 0.5rem; border-radius: 6px;">${dateStr} の履歴</span>`;
}

// Bind load functions to global window object
window.loadNormalHistory = loadNormalHistoryItem;
window.loadSeatingHistory = loadSeatingHistoryItem;

// Start
init();
