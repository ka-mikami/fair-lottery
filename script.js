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
  seatingWeightSettings: document.getElementById('seating-weight-settings'),
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
  rouletteResultContainer: document.getElementById('roulette-result-container'),
  resultList: document.getElementById('result-list'),
  copyNormalResultBtn: document.getElementById('copy-normal-result-btn'),
  seatingGrid: document.getElementById('seating-grid'),
  sortTabs: document.querySelectorAll('.sort-tab'),
  retryBtn: document.getElementById('retry-btn'),
  editBtn: document.getElementById('edit-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),

  // Roulette UI elements
  rouletteRemoveToggle: document.getElementById('roulette-remove-toggle'),
  rouletteHistoryList: document.getElementById('roulette-history-list'),
  rouletteCanvas: document.getElementById('roulette-canvas'),
  rouletteWinnerPanel: document.getElementById('roulette-winner-panel'),
  rouletteWinnerInput: document.getElementById('roulette-winner-input'),
  rouletteCopyBtn: document.getElementById('roulette-copy-btn'),
  
  // Free Layout UI elements
  btnSeatingGridMode: document.getElementById('btn-seating-grid-mode'),
  btnSeatingFreeMode: document.getElementById('btn-seating-free-mode'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),
  btnAddGroupFrame: document.getElementById('btn-add-group-frame'),
  btnResetLayout: document.getElementById('btn-reset-layout'),
  btnDownloadSeating: document.getElementById('btn-download-seating'),
  seatingScrollContainer: document.getElementById('seating-scroll-container'),
  seatingInstructionHint: document.getElementById('seating-instruction-hint')
};

// Undo / Redo Stacks
let undoStack = [];
let redoStack = [];

// State
let state = {
  mode: 'normal', // 'normal', 'seating', or 'roulette'
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
  rouletteHistory: [], // Roulette lottery history: max 5 items
  rouletteRemoveSelected: false, // Auto exclude toggle
  rouletteWinner: '', // Winner name
  currentRouletteWinners: [], // Session winners list
  isViewingHistory: false, // Flag to identify if viewing history
  theme: 'dark', // 'dark' or 'light'
  useWeighting: false,
  seatingLayout: [], // Custom seat layouts (true = seat, false = aisle)
  selectedSeatIndex: null, // for mobile tap-to-swap
  seatingMode: 'grid', // 'grid' or 'free'
  freeSeats: [], // position coordinates [{name, x, y}]
  freeGroups: [], // resizable group frames [{id, name, x, y, w, h}]
  nextGroupId: 1,
  activeGroupId: null // currently selected group frame ID
};

// Roulette Color Palette
const rouletteColors = [
  '#2563eb', '#3b82f6', '#10b981', '#059669', '#f59e0b', '#d97706',
  '#dc2626', '#b91c1c', '#7c3aed', '#6d28d9', '#ec4899', '#db2777'
];

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

  // Load roulette history
  try {
    const savedRouletteHistory = localStorage.getItem('rouletteHistory');
    if (savedRouletteHistory) {
      state.rouletteHistory = JSON.parse(savedRouletteHistory);
    }
  } catch (e) {
    state.rouletteHistory = [];
  }

  // Load roulette remove option
  try {
    const savedRouletteRemove = localStorage.getItem('rouletteRemoveSelected');
    if (savedRouletteRemove !== null) {
      state.rouletteRemoveSelected = savedRouletteRemove === 'true';
      if (els.rouletteRemoveToggle) {
        els.rouletteRemoveToggle.checked = state.rouletteRemoveSelected;
      }
    }
  } catch (e) {
    state.rouletteRemoveSelected = false;
  }

  // Load theme from localStorage
  try {
    const savedTheme = localStorage.getItem('lotteryTheme');
    if (savedTheme === 'light') {
      state.theme = 'light';
      document.body.classList.add('light-theme');
    } else {
      state.theme = 'dark';
      document.body.classList.remove('light-theme');
    }
  } catch (e) {
    state.theme = 'dark';
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
    if (savedMode === 'normal' || savedMode === 'seating' || savedMode === 'roulette') {
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
        
        // Toggle seating weight settings visibility
        if (els.seatingWeightSettings) {
          if (state.mode === 'seating') {
            els.seatingWeightSettings.style.display = 'flex';
          } else {
            els.seatingWeightSettings.style.display = 'none';
          }
        }
        
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
    els.participantsNumber.value = Math.max(0, parseInt(els.participantsNumber.value) - 1);
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
  els.startBtn.addEventListener('click', () => startLottery(false));
  els.retryBtn.addEventListener('click', () => {
    const participants = getParticipants();
    if (participants.length === 0) {
      alert('参加者が設定されていないか、すべて除外されました。設定画面に戻ります。');
      els.resultSection.classList.replace('active-section', 'hidden-section');
      els.setupSection.classList.replace('hidden-section', 'active-section');
      return;
    }
    els.resultSection.classList.replace('active-section', 'hidden-section');
    startLottery(true);
  });
  els.editBtn.addEventListener('click', () => {
    if (window.rouletteAnimFrameId) {
      cancelAnimationFrame(window.rouletteAnimFrameId);
      window.rouletteAnimFrameId = null;
    }
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
      try {
        localStorage.setItem('seatingUseWeighting', state.useWeighting);
      } catch (err) {}
    });
  }

  if (els.resetHistoryBtn) {
    els.resetHistoryBtn.addEventListener('click', () => {
      if (confirm('過去のすべての結果履歴（くじ引き・席替え・ルーレット）を削除してもよろしいですか？（偏り防止の基準もリセットされます）')) {
        state.history = [];
        state.normalHistory = [];
        state.rouletteHistory = [];
        try {
          localStorage.removeItem('seatingHistory');
          localStorage.removeItem('normalLotteryHistory');
          localStorage.removeItem('rouletteHistory');
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

  // Theme Toggle Button Event
  if (els.themeToggleBtn) {
    els.themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      state.theme = isLight ? 'light' : 'dark';
      try {
        localStorage.setItem('lotteryTheme', state.theme);
      } catch (err) {}
    });
  }

  // Roulette Toggle Event
  if (els.rouletteRemoveToggle) {
    els.rouletteRemoveToggle.addEventListener('change', e => {
      state.rouletteRemoveSelected = e.target.checked;
      try {
        localStorage.setItem('rouletteRemoveSelected', state.rouletteRemoveSelected);
      } catch (err) {}
    });
  }

  // Roulette Copy Button Event
  if (els.rouletteCopyBtn) {
    els.rouletteCopyBtn.addEventListener('click', () => {
      const winnerName = els.rouletteWinnerInput.value;
      if (!winnerName) return;

      navigator.clipboard.writeText(winnerName).then(() => {
        // Show tooltip
        let tooltip = els.rouletteCopyBtn.querySelector('.copy-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('span');
          tooltip.className = 'copy-tooltip';
          tooltip.textContent = 'コピーしました！';
          els.rouletteCopyBtn.appendChild(tooltip);
        }
        
        els.rouletteCopyBtn.classList.add('copy-success');
        const btnText = els.rouletteCopyBtn.querySelector('.copy-btn-text');
        const origText = btnText ? btnText.textContent : '名前をコピーする';
        if (btnText) btnText.textContent = 'コピー完了！';

        tooltip.classList.add('show');
        setTimeout(() => {
          tooltip.classList.remove('show');
          els.rouletteCopyBtn.classList.remove('copy-success');
          if (btnText) btnText.textContent = origText;
        }, 1500);
      }).catch(err => {
        alert('コピーに失敗しました。直接テキストを選択してコピーしてください。');
      });
    });
  }

  // Normal Result Copy Button Event
  if (els.copyNormalResultBtn) {
    els.copyNormalResultBtn.addEventListener('click', () => {
      const items = els.resultList.querySelectorAll('.result-item');
      if (items.length === 0) return;
      
      let textToCopy = '【抽選結果】\n';
      items.forEach((item, index) => {
        const nameEl = item.querySelector('.result-name');
        const roleEl = item.querySelector('.result-role');
        const name = nameEl ? nameEl.textContent.trim() : '';
        const role = roleEl && roleEl.textContent.trim() !== '設定なし' ? ` - ${roleEl.textContent.trim()}` : '';
        textToCopy += `${index + 1}. ${name}${role}\n`;
      });

      navigator.clipboard.writeText(textToCopy.trim()).then(() => {
        const origHtml = els.copyNormalResultBtn.innerHTML;
        els.copyNormalResultBtn.innerHTML = '<span class="material-icons" style="color: #10b981;">check</span> コピー完了！';
        els.copyNormalResultBtn.style.color = '#10b981';
        els.copyNormalResultBtn.style.borderColor = '#10b981';
        setTimeout(() => {
          els.copyNormalResultBtn.innerHTML = origHtml;
          els.copyNormalResultBtn.style.color = '';
          els.copyNormalResultBtn.style.borderColor = '';
        }, 1500);
      }).catch(err => {
        alert('コピーに失敗しました。');
      });
    });
  }

  // Free Layout Toolbar Events
  if (els.btnSeatingGridMode && els.btnSeatingFreeMode) {
    els.btnSeatingGridMode.addEventListener('click', () => {
      if (state.seatingMode === 'grid') return;
      toggleFreeLayoutMode('grid');
    });

    els.btnSeatingFreeMode.addEventListener('click', () => {
      if (state.seatingMode === 'free') return;
      toggleFreeLayoutMode('free');
    });
  }

  if (els.btnAddGroupFrame) {
    els.btnAddGroupFrame.addEventListener('click', () => {
      if (state.seatingMode !== 'free') return;
      
      const presetColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
      const randomColor = presetColors[state.freeGroups.length % presetColors.length];
      
      const newGroup = {
        id: state.nextGroupId++,
        name: `班 ${state.nextGroupId - 1}`,
        x: 100 + Math.random() * 50,
        y: 100 + Math.random() * 50,
        w: 240,
        h: 180,
        color: randomColor
      };
      
      state.freeGroups.push(newGroup);
      addGroupFrame(newGroup);
      
      // Save changes to history
      const rows = parseInt(els.seatingRows.value) || 0;
      const cols = parseInt(els.seatingCols.value) || 0;
      updateHistoryAfterSwap(rows, cols);
    });
  }

  if (els.btnResetLayout) {
    els.btnResetLayout.addEventListener('click', () => {
      if (confirm('フリー配置と作成した班の枠をすべてリセットし、元の整列状態に戻しますか？')) {
        resetToGridLayout();
      }
    });
  }

  if (els.btnUndo) {
    els.btnUndo.addEventListener('click', handleUndo);
  }
  if (els.btnRedo) {
    els.btnRedo.addEventListener('click', handleRedo);
  }
  if (els.btnDownloadSeating) {
    els.btnDownloadSeating.addEventListener('click', downloadSeatingImage);
  }

  // キャンバス背景クリックで選択解除
  if (els.seatingScrollContainer) {
    const handleCanvasClick = (e) => {
      if (state.seatingMode !== 'free') return;
      // クリックターゲットがキャンバス背景自体、またはグリッドコンテナの場合のみ解除
      if (e.target === els.seatingScrollContainer || e.target === els.seatingGrid) {
        setActiveGroup(null);
      }
    };
    els.seatingScrollContainer.addEventListener('mousedown', handleCanvasClick);
    els.seatingScrollContainer.addEventListener('touchstart', handleCanvasClick, { passive: true });
  }

  // キーボードショートカット (Ctrl+Z / Ctrl+Y)
  document.addEventListener('keydown', (e) => {
    // 席替え結果画面が表示されている時のみ動作
    if (els.resultSection && els.resultSection.classList.contains('active-section') && state.mode === 'seating') {
      // テキスト入力中はショートカットを無効化
      if (e.target.closest('input, textarea, [contenteditable="true"]')) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    }
  });
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
    label.className = 'priority-member-label';
    label.title = name;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'priority-member-checkbox';
    checkbox.value = name;
    if (checkedMembers.has(name)) {
      checkbox.checked = true;
      label.classList.add('checked');
    }
    
    // UI improvement: Change style on check
    checkbox.addEventListener('change', () => {
      label.classList.toggle('checked', checkbox.checked);
    });
    
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
  } else if (state.mode === 'seating') {
    // Seating mode validation
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    const totalSeats = rows * cols;
    
    // 同期処理
    if (state.seatingLayout.length !== totalSeats) {
      state.seatingLayout = Array.from({ length: totalSeats }, () => true);
    }

    let availableSeatsCount = totalSeats;

    els.totalSeatsDisplay.textContent = availableSeatsCount;
    
    if (pCount === 0) {
      els.seatingWarning.textContent = '参加者が設定されていません。';
      els.startBtn.disabled = true;
      els.startBtn.style.opacity = '0.5';
    } else if (pCount > availableSeatsCount) {
      els.seatingWarning.textContent = `配置可能な席数(${availableSeatsCount}席)が足りません！行または列を増やしてください。`;
      els.startBtn.disabled = true;
      els.startBtn.style.opacity = '0.5';
    } else {
      const emptyCount = availableSeatsCount - pCount;
      els.seatingWarning.textContent = emptyCount > 0 ? `空席が ${emptyCount} 席できます。` : '';
      els.startBtn.disabled = false;
      els.startBtn.style.opacity = '1';
    }
  } else {
    // Roulette mode validation
    if (pCount === 0) {
      els.startBtn.disabled = true;
      els.startBtn.style.opacity = '0.5';
    } else {
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
    seatingLayout: [...state.seatingLayout],
    seatingMode: state.seatingMode,
    freeSeats: JSON.parse(JSON.stringify(state.freeSeats)),
    freeGroups: JSON.parse(JSON.stringify(state.freeGroups)),
    nextGroupId: state.nextGroupId,
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

function startLottery(isRetry = false) {
  // Undo/Redoスタックの初期化
  undoStack = [];
  redoStack = [];
  
  state.selectedSeatIndex = null; // Reset selection state
  state.isViewingHistory = false; // Reset history viewing flag
  
  // Save participants list to history
  if (!isRetry) {
    saveParticipantsTextToHistory();
    state.currentRouletteWinners = [];
  }
  
  const participants = getParticipants();
  if (participants.length === 0) {
    // 画面が真っ白になるのを防ぐため、設定画面に戻す
    els.resultSection.classList.replace('active-section', 'hidden-section');
    els.setupSection.classList.replace('hidden-section', 'active-section');
    return;
  }

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
  } else if (state.mode === 'seating') {
    // Seating mode lottery
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    const totalSeats = rows * cols;
    
    // 新規抽選の場合は、すべての席を机（通路なし）に初期化
    if (!isRetry) {
      state.seatingLayout = Array.from({ length: totalSeats }, () => true);
    }
    
    // Initialize seat mapping
    state.finalSeatingResult = Array.from({ length: totalSeats }, () => null);

    // 1. Get priority members (checked ones)
    const priorityMembers = [];
    document.querySelectorAll('.priority-member-checkbox:checked').forEach(cb => {
      priorityMembers.push(cb.value);
    });

    // 2. Identify priority seats (Front 2 rows: row < 2) amongst non-aisle seats, front-packed
    // If rows <= 2, prioritize row < 1 (front 1 row). If rows === 1, prioritize the whole row.
    const priorityLimitRow = rows <= 2 ? 1 : 2;
    const prioritySeats = [];
    const regularSeats = [];
    
    // Filter out aisle seats first
    const allAvailableSeats = [];
    for (let seatIdx = 0; seatIdx < totalSeats; seatIdx++) {
      if (state.seatingLayout[seatIdx] !== false) {
        allAvailableSeats.push(seatIdx);
      }
    }
    
    // Consider only occupied seats (front-packing) based on participants count
    const activeSeats = allAvailableSeats.slice(0, participants.length);
    
    activeSeats.forEach(seatIdx => {
      const row = Math.floor(seatIdx / cols);
      if (row < priorityLimitRow) {
        prioritySeats.push(seatIdx);
      } else {
        regularSeats.push(seatIdx);
      }
    });

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
  } else {
    // Roulette mode lottery
    let roulettePool = participants;
    if (state.rouletteRemoveSelected && state.currentRouletteWinners.length > 0) {
      roulettePool = participants.filter(p => !state.currentRouletteWinners.includes(p));
    }
    if (roulettePool.length === 0) {
      alert('ルーレットを回す参加者がいません。');
      return;
    }
    const shuffled = secureShuffle(roulettePool);
    state.rouletteWinner = shuffled[0];
    saveRouletteToHistory(isRetry);
  }

  // UI transition
  els.setupSection.classList.replace('active-section', 'hidden-section');

  if (state.mode === 'roulette') {
    els.resultSection.classList.replace('hidden-section', 'active-section');
    showResult();
  } else {
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
}

function showResult() {
  // Undoスタックの初期状態のプッシュとボタン表示更新
  if (state.mode === 'seating' && undoStack.length === 0) {
    undoStack.push(getSnapshot());
    updateUndoRedoButtons();
  }

  // Show or hide retry button depending on history viewing mode
  if (els.retryBtn) {
    if (state.isViewingHistory) {
      els.retryBtn.style.display = 'none';
    } else {
      els.retryBtn.style.display = 'block';
    }
  }

  // Enable buttons by default (will be disabled during roulette spin)
  [els.retryBtn, els.editBtn].forEach(btn => {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  });

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
  } else if (state.mode === 'seating') {
    // Seating result rendering
    els.resultTitle.textContent = '座席配置';
    els.normalResultContainer.classList.add('hidden-section');
    els.seatingResultContainer.classList.remove('hidden-section');
    els.rouletteResultContainer.classList.add('hidden-section');
    
    // Clear previous group frames from DOM
    document.querySelectorAll('.group-frame').forEach(f => f.remove());
    
    els.seatingGrid.innerHTML = '';
    
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;

    // Show/hide toolbar buttons according to state.seatingMode
    if (els.btnSeatingGridMode && els.btnSeatingFreeMode && els.btnAddGroupFrame && els.btnResetLayout) {
      if (state.seatingMode === 'free') {
        els.btnSeatingGridMode.classList.remove('active');
        els.btnSeatingGridMode.style.color = 'var(--text-secondary)';
        els.btnSeatingFreeMode.classList.add('active');
        els.btnSeatingFreeMode.style.color = '#ffffff';
        
        els.btnAddGroupFrame.style.display = 'flex';
        els.btnResetLayout.style.display = 'flex';
        els.seatingInstructionHint.textContent = '💡 席カードや班の枠をドラッグして、自由なレイアウトやチーム分けをデザインできます！';
        
        els.seatingScrollContainer.classList.add('free-layout-canvas');
        els.seatingGrid.style.display = 'block';
        els.seatingGrid.style.width = '100%';
        els.seatingGrid.style.minWidth = '800px';
        els.seatingGrid.style.height = '500px';
      } else {
        els.btnSeatingGridMode.classList.add('active');
        els.btnSeatingGridMode.style.color = '#ffffff';
        els.btnSeatingFreeMode.classList.remove('active');
        els.btnSeatingFreeMode.style.color = 'var(--text-secondary)';
        
        els.btnAddGroupFrame.style.display = 'none';
        els.btnResetLayout.style.display = 'none';
        els.seatingInstructionHint.textContent = '💡 席をドラッグ＆ドロップ、または2つの席を順番にタップすることで、自由に配置を入れ替えられます！';
        
        els.seatingScrollContainer.classList.remove('free-layout-canvas');
        els.seatingGrid.style.display = 'grid';
        els.seatingGrid.style.width = 'max-content';
        els.seatingGrid.style.minWidth = 'unset';
        els.seatingGrid.style.height = 'auto';
      }
    }
    
    // Calculate dynamic column widths and heights for grid layout (for absolute placement calculation)
    const colWidths = [];
    for (let c = 0; c < cols; c++) {
      let isAllAisle = true;
      for (let r = 0; r < rows; r++) {
        const idx = r * cols + c;
        if (state.seatingLayout[idx] !== false) {
          isAllAisle = false;
          break;
        }
      }
      colWidths.push(isAllAisle ? '20px' : '1fr');
    }
    
    const rowHeights = [];
    for (let r = 0; r < rows; r++) {
      let isAllAisle = true;
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (state.seatingLayout[idx] !== false) {
          isAllAisle = false;
          break;
        }
      }
      rowHeights.push(isAllAisle ? '20px' : 'auto');
    }

    if (state.seatingMode !== 'free') {
      els.seatingGrid.style.gridTemplateColumns = colWidths.map(w => w === '20px' ? '20px' : '1fr').join(' ');
      els.seatingGrid.style.gridTemplateRows = rowHeights.map(h => h === '20px' ? '20px' : 'auto').join(' ');
    }
    
    let seatNumber = 1;
    state.finalSeatingResult.forEach((person, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;

      if (state.seatingLayout[idx] === false) {
        if (state.seatingMode !== 'free') {
          // Grid mode renders aisle seats as empty invisible blocks
          const seatDiv = document.createElement('div');
          seatDiv.dataset.index = idx;
          seatDiv.style.animationDelay = `${(r + c) * 0.05}s`;
          seatDiv.className = 'seat aisle';
          els.seatingGrid.appendChild(seatDiv);
        }
        return;
      }
      
      const currentSeatNumber = seatNumber++;
      const seatDiv = document.createElement('div');
      seatDiv.dataset.index = idx;
      seatDiv.style.animationDelay = `${(r + c) * 0.05}s`;
      
      if (person) {
        seatDiv.title = person;
        seatDiv.innerHTML = `
          <span class="seat-number">席 ${currentSeatNumber}</span>
          <span class="seat-name" title="${escapeHTML(person)}">${escapeHTML(getDisplayName(person))}</span>
        `;
      } else {
        seatDiv.title = '空席';
        seatDiv.innerHTML = `
          <span class="seat-number">席 ${currentSeatNumber}</span>
          <span class="seat-name">空席</span>
        `;
      }

      if (state.seatingMode === 'free') {
        seatDiv.className = 'seat free-element';
        if (person) seatDiv.classList.add('occupied');
        else seatDiv.classList.add('empty');
        
        // Find saved coordinates for this person
        let x = 0, y = 0;
        const savedSeat = person ? state.freeSeats.find(s => s.name === person) : null;
        
        if (savedSeat && savedSeat.x !== undefined && savedSeat.y !== undefined) {
          x = savedSeat.x;
          y = savedSeat.y;
        } else {
          // Calculate initial absolute coordinates from grid index
          const startX = 40;
          const startY = 40;
          
          x = startX;
          for (let colIdx = 0; colIdx < c; colIdx++) {
            x += (colWidths[colIdx] === '20px') ? 40 : 130;
          }
          y = startY;
          for (let rowIdx = 0; rowIdx < r; rowIdx++) {
            y += (rowHeights[rowIdx] === '20px') ? 40 : 90;
          }
          
          // Save calculated coordinates back to state.freeSeats
          if (person) {
            state.freeSeats.push({ name: person, x: x, y: y });
          }
        }
        
        seatDiv.style.left = `${x}px`;
        seatDiv.style.top = `${y}px`;
        
        // Bind absolute element dragging
        initElementDrag(seatDiv, true);
      } else {
        seatDiv.className = 'seat';
        if (person) seatDiv.classList.add('occupied');
        else seatDiv.classList.add('empty');
        
        seatDiv.setAttribute('draggable', 'true');
        
        // Grid mode: Bind HTML5 Drag & Drop Swap events
        seatDiv.addEventListener('dragstart', handleDragStart);
        seatDiv.addEventListener('dragover', handleDragOver);
        seatDiv.addEventListener('dragenter', handleDragEnter);
        seatDiv.addEventListener('dragleave', handleDragLeave);
        seatDiv.addEventListener('drop', handleDrop);
        seatDiv.addEventListener('dragend', handleDragEnd);
        
        // Grid mode: Bind Tap-to-Swap Click Event
        seatDiv.addEventListener('click', handleSeatClick);
      }

      els.seatingGrid.appendChild(seatDiv);
    });

    // In Free mode, render the group frames
    if (state.seatingMode === 'free') {
      // Sync canvas has-active-frame class
      const canvas = els.seatingScrollContainer;
      if (canvas) {
        if (state.activeGroupId !== null) {
          canvas.classList.add('has-active-frame');
        } else {
          canvas.classList.remove('has-active-frame');
        }
      }
      state.freeGroups.forEach(group => {
        addGroupFrame(group);
      });
    }
  } else {
    // Roulette result rendering
    const pCount = getParticipants().length;
    els.resultTitle.textContent = pCount === 1 ? 'ルーレット（最後の1人）' : 'ルーレット';
    els.normalResultContainer.classList.add('hidden-section');
    els.seatingResultContainer.classList.add('hidden-section');
    els.rouletteResultContainer.classList.remove('hidden-section');

    if (window.rouletteAnimFrameId) {
      cancelAnimationFrame(window.rouletteAnimFrameId);
    }

    els.rouletteWinnerPanel.classList.add('hidden-section');
    els.rouletteWinnerInput.value = '';

    runRouletteAnimation();
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

function updateHistoryAfterSwap(rows, cols, shouldSaveUndo = true) {
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
  state.history[state.history.length - 1].seatingLayout = [...state.seatingLayout];
  state.history[state.history.length - 1].seatingMode = state.seatingMode;
  state.history[state.history.length - 1].freeSeats = JSON.parse(JSON.stringify(state.freeSeats));
  state.history[state.history.length - 1].freeGroups = JSON.parse(JSON.stringify(state.freeGroups));
  state.history[state.history.length - 1].nextGroupId = state.nextGroupId;
  localStorage.setItem('seatingHistory', JSON.stringify(state.history));

  // Undoスタックへの保存
  if (shouldSaveUndo) {
    saveStateForUndo();
  }
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

  // Update roulette history
  if (els.rouletteHistoryList) {
    els.rouletteHistoryList.innerHTML = '';
    if (!state.rouletteHistory || state.rouletteHistory.length === 0) {
      els.rouletteHistoryList.innerHTML = '<p class="hint" style="text-align: center; padding: 1rem 0;">履歴はありません</p>';
    } else {
      // Show newest first
      [...state.rouletteHistory].reverse().forEach((h, revIndex) => {
        const index = state.rouletteHistory.length - 1 - revIndex;

        const row = document.createElement('div');
        row.className = 'history-item-row';

        const date = new Date(h.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        const winners = h.winners || [h.winner];
        const firstWinner = getDisplayName(winners[0]);
        const otherCount = winners.length - 1;
        const displaySummary = otherCount > 0 ? `${firstWinner} 他${otherCount}名` : firstWinner;
        const totalParticipants = h.initialParticipantsCount || h.participantsCount || (winners.length + (h.participantsCount || 0));

        row.innerHTML = `
          <div class="history-item-info" style="flex: 1; min-width: 0; margin-right: 0.5rem;">
            <span class="history-item-time">${dateStr}</span>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;" title="${escapeHTML(winners.map(w => getDisplayName(w)).join(' ➔ '))} font-weight: 600;">当選: ${escapeHTML(displaySummary)}</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">（開始時: ${totalParticipants}人）</span>
          </div>
          <button class="history-item-btn" onclick="loadRouletteHistory(${index})">結果を見る</button>
        `;
        els.rouletteHistoryList.appendChild(row);
      });
    }
  }
}

function loadNormalHistoryItem(index) {
  if (!state.normalHistory || !state.normalHistory[index]) return;
  const item = state.normalHistory[index];
  
  state.isViewingHistory = true;
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
  
  // Undo/Redoスタックの初期化
  undoStack = [];
  redoStack = [];
  
  state.isViewingHistory = true;
  const rows = item.rows;
  const cols = item.cols;
  
  if (els.seatingRows && els.seatingCols) {
    els.seatingRows.value = rows;
    els.seatingCols.value = cols;
  }
  
  const totalSeats = rows * cols;
  
  // Restore seating layout, fallback to all true if missing
  if (item.seatingLayout) {
    state.seatingLayout = [...item.seatingLayout];
  } else {
    state.seatingLayout = Array.from({ length: totalSeats }, () => true);
  }
  
  // Restore Free Layout elements, fallback if missing
  state.seatingMode = item.seatingMode || 'grid';
  state.freeSeats = item.freeSeats ? JSON.parse(JSON.stringify(item.freeSeats)) : [];
  state.freeGroups = item.freeGroups ? JSON.parse(JSON.stringify(item.freeGroups)) : [];
  state.nextGroupId = item.nextGroupId || 1;
  
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
window.loadRouletteHistory = loadRouletteHistoryItem;

function saveRouletteToHistory(isRetry = false) {
  if (!state.rouletteHistory) {
    state.rouletteHistory = [];
  }

  if (isRetry && state.rouletteHistory.length > 0) {
    // リトライ時は既存の最新セッションに当選者を追加
    const currentSession = state.rouletteHistory[state.rouletteHistory.length - 1];
    if (!currentSession.winners) {
      currentSession.winners = [currentSession.winner || state.rouletteWinner];
    }
    if (!currentSession.winners.includes(state.rouletteWinner)) {
      currentSession.winners.push(state.rouletteWinner);
    }
    currentSession.timestamp = Date.now();
  } else {
    // 新規開始時は新しいセッションを作成
    const newEvent = {
      timestamp: Date.now(),
      winners: [state.rouletteWinner],
      initialParticipantsCount: getParticipants().length,
      removed: state.rouletteRemoveSelected
    };
    state.rouletteHistory.push(newEvent);
  }

  while (state.rouletteHistory.length > 5) {
    state.rouletteHistory.shift();
  }

  try {
    localStorage.setItem('rouletteHistory', JSON.stringify(state.rouletteHistory));
  } catch (e) {}

  updateResultsHistoryList();
}

function runRouletteAnimation() {
  const canvas = els.rouletteCanvas;
  if (!canvas) return;
  
  // Set canvas size dynamically based on its visible container
  let cw = canvas.parentElement.clientWidth;
  if (cw < 300) cw = 640; // Fallback for when container is hidden or too small
  canvas.width = cw;
  canvas.height = cw;

  const ctx = canvas.getContext('2d');
  
  let participants = getParticipants();
  
  if (state.rouletteRemoveSelected && state.currentRouletteWinners.length > 0) {
    participants = participants.filter(p => !state.currentRouletteWinners.includes(p));
  }
  
  const count = participants.length;
  
  if (count === 0) {
    alert('ルーレットを回す参加者がいません。');
    return;
  }

  // Disable action buttons during spin to prevent double-triggering or state corruption
  [els.retryBtn, els.editBtn].forEach(btn => {
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.pointerEvents = 'none';
    }
  });

  const winner = state.rouletteWinner;
  let winnerIdx = participants.indexOf(winner);
  if (winnerIdx === -1) winnerIdx = 0;

  const arcSize = (Math.PI * 2) / count;
  
  let startTime = null;
  // 参加者が1人の場合はルーレットを回す意味がないため、アニメーション時間を0にして即座に結果を表示する
  const duration = count === 1 ? 0 : 4000;
  
  // 針は真上（-Math.PI / 2）を指す
  const baseStopRotation = -Math.PI / 2 - (winnerIdx * arcSize + arcSize / 2);
  const targetRotation = baseStopRotation - (Math.PI * 2 * 6); // 逆方向に6回転

  const startRotation = 0;

  function drawWheel(currentRotation) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 15;

    for (let i = 0; i < count; i++) {
      const angle = currentRotation + i * arcSize;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + arcSize);
      ctx.closePath();
      
      ctx.fillStyle = rouletteColors[i % rouletteColors.length];
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Name Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + arcSize / 2);
      
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      
      let fontSize = 24;
      if (count > 25) fontSize = 12;
      else if (count > 15) fontSize = 16;
      else if (count > 10) fontSize = 20;
      
      ctx.font = `bold ${fontSize}px sans-serif`;
      
      const displayName = getDisplayName(participants[i]);
      const textToDraw = displayName.length > 10 ? displayName.slice(0, 9) + '..' : displayName;
      ctx.fillText(textToDraw, radius - 20, 0);
      ctx.restore();
    }

    // Center Pin
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease Out Cubic
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentRotation = startRotation + (targetRotation - startRotation) * easeOutCubic;
    
    drawWheel(currentRotation);
    
    if (progress < 1) {
      window.rouletteAnimFrameId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(window.rouletteAnimFrameId);
      window.rouletteAnimFrameId = null;
      
      // Update Winner UI
      els.rouletteWinnerInput.value = getDisplayName(state.rouletteWinner);
      els.rouletteWinnerPanel.classList.remove('hidden-section');
      
      // Add to session winners list and update UI
      if (!state.currentRouletteWinners.includes(state.rouletteWinner)) {
        state.currentRouletteWinners.push(state.rouletteWinner);
      }
      updateRouletteSessionWinnersUI(state.currentRouletteWinners);
      
      // Re-enable action buttons after spin completes
      [els.retryBtn, els.editBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        }
      });
      
      // Trigger Exclude
      if (state.rouletteRemoveSelected) {
        removeWinnerFromParticipants(state.rouletteWinner);
      }
    }
  }

  window.rouletteAnimFrameId = requestAnimationFrame(animate);
}

function removeWinnerFromParticipants(winnerName) {
  if (state.inputType === 'names-input') {
    const text = els.participantsText.value;
    const lines = text.split('\n');
    
    const index = lines.findIndex(line => {
      return line.trim() === winnerName.trim() || getDisplayName(line) === getDisplayName(winnerName);
    });
    
    if (index !== -1) {
      lines.splice(index, 1);
      els.participantsText.value = lines.join('\n');
      updateParticipantCount();
    }
  } else {
    els.participantsNumber.value = Math.max(0, parseInt(els.participantsNumber.value) - 1);
    updateParticipantCount();
  }
}

function loadRouletteHistoryItem(index) {
  if (!state.rouletteHistory || !state.rouletteHistory[index]) return;
  const item = state.rouletteHistory[index];

  state.isViewingHistory = true;
  const winners = item.winners || [item.winner];
  const lastWinner = winners[winners.length - 1];

  state.rouletteWinner = lastWinner;
  state.currentRouletteWinners = [...winners];
  state.mode = 'roulette';

  if (els.modeTabs) {
    const btn = els.modeTabs.querySelector('button[data-mode="roulette"]');
    if (btn) {
      els.modeTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }

  els.setupSection.classList.replace('active-section', 'hidden-section');
  els.resultSection.classList.replace('hidden-section', 'active-section');
  
  els.resultTitle.textContent = 'ルーレット';
  els.normalResultContainer.classList.add('hidden-section');
  els.seatingResultContainer.classList.add('hidden-section');
  els.rouletteResultContainer.classList.remove('hidden-section');

  els.rouletteWinnerInput.value = getDisplayName(lastWinner);
  els.rouletteWinnerPanel.classList.remove('hidden-section');
  
  // Update session list UI
  updateRouletteSessionWinnersUI(winners);

  // Hide retry button and reset action buttons state for history view
  if (els.retryBtn) {
    els.retryBtn.style.display = 'none';
  }
  [els.retryBtn, els.editBtn].forEach(btn => {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  });

  const totalCount = item.initialParticipantsCount || item.participantsCount || 10;
  drawStaticWheel(lastWinner, totalCount);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  els.resultTitle.innerHTML = `ルーレット結果 <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); margin-left: 0.5rem; background: rgba(255,255,255,0.08); padding: 0.2rem 0.5rem; border-radius: 6px;">${dateStr} の履歴</span>`;
}

function drawStaticWheel(winner, totalCount) {
  const canvas = els.rouletteCanvas;
  if (!canvas) return;

  let cw = canvas.parentElement.clientWidth;
  if (cw < 300) cw = 640;
  canvas.width = cw;
  canvas.height = cw;

  const ctx = canvas.getContext('2d');
  const count = totalCount || 10;
  
  const arcSize = (Math.PI * 2) / count;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = cx - 15;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const currentRotation = -Math.PI / 2 - arcSize / 2;

  for (let i = 0; i < count; i++) {
    const angle = currentRotation + i * arcSize;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + arcSize);
    ctx.closePath();

    ctx.fillStyle = rouletteColors[i % rouletteColors.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + arcSize / 2);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    
    let fontSize = 24;
    if (count > 25) fontSize = 12;
    else if (count > 15) fontSize = 16;
    else if (count > 10) fontSize = 20;
    
    ctx.font = `bold ${fontSize}px sans-serif`;

    const nameToDraw = i === 0 ? getDisplayName(winner) : `参加者 ${i + 1}`;
    const textToDraw = nameToDraw.length > 10 ? nameToDraw.slice(0, 9) + '..' : nameToDraw;
    ctx.fillText(textToDraw, radius - 20, 0);
    ctx.restore();
  }

  // Center Pin
  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 5;
  ctx.stroke();
}

function updateRouletteSessionWinnersUI(winners) {
  const container = document.getElementById('roulette-session-winners');
  const list = document.getElementById('roulette-session-list');
  if (!container || !list) return;

  list.innerHTML = '';
  if (winners && winners.length > 0) {
    winners.forEach((w, index) => {
      const li = document.createElement('li');
      li.className = 'session-winner-item';
      
      // 最初は現在選択されている当選者をアクティブにする
      if (w === state.rouletteWinner) {
        li.classList.add('active-winner');
      }
      
      li.innerHTML = `<span style="color: var(--text-secondary); margin-right: 0.5rem; font-size: 0.85rem;">#${index + 1}</span> ${escapeHTML(getDisplayName(w))}`;
      
      li.addEventListener('click', () => {
        list.querySelectorAll('li').forEach(item => {
          item.classList.remove('active-winner');
        });
        li.classList.add('active-winner');
        
        state.rouletteWinner = w;
        els.rouletteWinnerInput.value = getDisplayName(w);
      });
      
      list.appendChild(li);
    });
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}



function initElementDrag(element, isSeat) {
  let startLeft = 0, startTop = 0, startWidth = 0, startHeight = 0;
  let startMouseX = 0, startMouseY = 0;
  const SNAP = 10; // 10px単位のグリッドスナップ
  
  // 席カードもグループ枠も要素全体でドラッグを開始できるようにする
  // (ただし、枠はz-index: 4に設定し、通常の座席のz-index: 5より下に配置することで、枠内の座席の直接操作を可能にします)
  const dragTrigger = element;
  
  dragTrigger.addEventListener('mousedown', dragMouseDown);
  dragTrigger.addEventListener('touchstart', dragTouchStart, { passive: false });

  // カーソルの se-resize 変更は CSS (.group-frame-resize-area) に移譲し、ちらつきバグを解消

  function dragMouseDown(e) {
    if (e.target.closest('button, input, select, .group-color-selector, .color-chip, [contenteditable="true"]')) return;
    
    // リサイズ領域をクリックした場合はリサイズを開始する
    if (!isSeat) {
      const rect = element.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const resizeThreshold = 30; // リサイズ領域の判定サイズ（px）
      if (rect.width - offsetX < resizeThreshold && rect.height - offsetY < resizeThreshold) {
        e.preventDefault();
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;
        document.addEventListener('mouseup', closeResizeElement);
        document.addEventListener('mousemove', elementResize);
        element.classList.add('resizing');
        return; // ドラッグ処理ではなくリサイズ処理へ
      }
    }
    
    e.preventDefault();
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
    element.classList.add('dragging');
  }

  function elementResize(e) {
    e.preventDefault();
    const diffX = e.clientX - startMouseX;
    const diffY = e.clientY - startMouseY;
    
    // スナップしてリサイズ
    const newWidth = Math.round((startWidth + diffX) / SNAP) * SNAP;
    const newHeight = Math.round((startHeight + diffY) / SNAP) * SNAP;
    
    element.style.width = `${Math.max(120, newWidth)}px`;
    element.style.height = `${Math.max(80, newHeight)}px`;
  }

  function closeResizeElement() {
    document.removeEventListener('mouseup', closeResizeElement);
    document.removeEventListener('mousemove', elementResize);
    element.classList.remove('resizing');
    saveDraggedCoordinates();
  }

  function elementDrag(e) {
    e.preventDefault();
    const diffX = e.clientX - startMouseX;
    const diffY = e.clientY - startMouseY;
    
    // スナップして移動
    const newLeft = Math.round((startLeft + diffX) / SNAP) * SNAP;
    const newTop = Math.round((startTop + diffY) / SNAP) * SNAP;
    
    element.style.left = `${Math.max(0, newLeft)}px`;
    element.style.top = `${Math.max(0, newTop)}px`;
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
    element.classList.remove('dragging');
    saveDraggedCoordinates();
  }

  // タッチ操作対応
  function dragTouchStart(e) {
    if (e.target.closest('button, input, select, .group-color-selector, .color-chip, [contenteditable="true"]')) return;
    const touch = e.touches[0];
    
    // リサイズ領域をタッチした場合はリサイズを開始する
    if (!isSeat) {
      const rect = element.getBoundingClientRect();
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;
      const resizeThreshold = 36; // モバイル用には少し大きめの閾値
      if (rect.width - offsetX < resizeThreshold && rect.height - offsetY < resizeThreshold) {
        startMouseX = touch.clientX;
        startMouseY = touch.clientY;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;
        document.addEventListener('touchend', closeTouchResizeElement);
        document.addEventListener('touchmove', touchElementResize, { passive: false });
        element.classList.add('resizing');
        return;
      }
    }
    
    startMouseX = touch.clientX;
    startMouseY = touch.clientY;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    document.addEventListener('touchend', closeTouchDragElement);
    document.addEventListener('touchmove', touchElementDrag, { passive: false });
    element.classList.add('dragging');
  }

  function touchElementResize(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const diffX = touch.clientX - startMouseX;
    const diffY = touch.clientY - startMouseY;
    
    const newWidth = Math.round((startWidth + diffX) / SNAP) * SNAP;
    const newHeight = Math.round((startHeight + diffY) / SNAP) * SNAP;
    
    element.style.width = `${Math.max(120, newWidth)}px`;
    element.style.height = `${Math.max(80, newHeight)}px`;
  }

  function closeTouchResizeElement() {
    document.removeEventListener('touchend', closeTouchResizeElement);
    document.removeEventListener('touchmove', touchElementResize);
    element.classList.remove('resizing');
    saveDraggedCoordinates();
  }

  function touchElementDrag(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const diffX = touch.clientX - startMouseX;
    const diffY = touch.clientY - startMouseY;
    
    const newLeft = Math.round((startLeft + diffX) / SNAP) * SNAP;
    const newTop = Math.round((startTop + diffY) / SNAP) * SNAP;
    
    element.style.left = `${Math.max(0, newLeft)}px`;
    element.style.top = `${Math.max(0, newTop)}px`;
  }

  function closeTouchDragElement() {
    document.removeEventListener('touchend', closeTouchDragElement);
    document.removeEventListener('touchmove', touchElementDrag);
    element.classList.remove('dragging');
    saveDraggedCoordinates();
  }

  function saveDraggedCoordinates() {
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;

    if (isSeat) {
      const idx = parseInt(element.dataset.index);
      const name = state.finalSeatingResult[idx];
      if (name) {
        let seatData = state.freeSeats.find(s => s.name === name);
        if (!seatData) {
          seatData = { name: name };
          state.freeSeats.push(seatData);
        }
        seatData.x = element.offsetLeft;
        seatData.y = element.offsetTop;
      }
    } else {
      const groupId = parseInt(element.dataset.groupId);
      const groupData = state.freeGroups.find(g => g.id === groupId);
      if (groupData) {
        groupData.x = element.offsetLeft;
        groupData.y = element.offsetTop;
        groupData.w = element.offsetWidth;
        groupData.h = element.offsetHeight;
      }
    }
    updateHistoryAfterSwap(rows, cols);
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function applyGroupFrameColor(frame, hexColor) {
  const bg = frame.querySelector('.group-frame-bg') || frame;
  bg.style.borderColor = hexColor;
  
  // 半透明の背景色を設定 (hexColor を rgba に変換)
  const rgb = hexToRgb(hexColor);
  if (rgb) {
    bg.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`;
    frame.style.setProperty('--frame-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
    frame.style.setProperty('--frame-glow-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
  } else {
    bg.style.backgroundColor = `${hexColor}10`; // hex alpha fallback
    frame.style.setProperty('--frame-glow', hexColor);
    frame.style.setProperty('--frame-glow-light', hexColor);
  }
  
  // ヘッダー内のラベルの色も同調
  const label = frame.querySelector('.group-frame-label');
  if (label) {
    label.style.color = hexColor;
  }
}

function setActiveGroup(groupId) {
  state.activeGroupId = groupId;
  
  const canvas = els.seatingScrollContainer;
  if (canvas) {
    if (groupId !== null) {
      canvas.classList.add('has-active-frame');
    } else {
      canvas.classList.remove('has-active-frame');
    }
  }
  
  document.querySelectorAll('.group-frame').forEach(frame => {
    const fId = parseInt(frame.dataset.groupId);
    if (fId === groupId) {
      frame.classList.add('active-frame');
    } else {
      frame.classList.remove('active-frame');
    }
  });
}

function addGroupFrame(groupData) {
  const container = els.seatingGrid;
  if (!container) return;

  const frame = document.createElement('div');
  frame.className = 'group-frame';
  frame.dataset.groupId = groupData.id;
  if (state.activeGroupId === groupData.id) {
    frame.classList.add('active-frame');
  }
  
  // 背景要素を追加 (z-indexスタッキング制御用)
  const frameBg = document.createElement('div');
  frameBg.className = 'group-frame-bg';
  frame.appendChild(frameBg);
  
  frame.style.left = `${groupData.x}px`;
  frame.style.top = `${groupData.y}px`;
  frame.style.width = `${groupData.w}px`;
  frame.style.height = `${groupData.h}px`;

  // 枠クリック／タッチでアクティブ化
  const selectHandler = (e) => {
    if (e.target.closest('button, input, select, .group-color-selector, .color-chip, [contenteditable="true"]')) return;
    setActiveGroup(groupData.id);
  };
  frame.addEventListener('mousedown', selectHandler);
  frame.addEventListener('touchstart', selectHandler, { passive: true });

  // ヘッダー要素
  const header = document.createElement('div');
  header.className = 'group-frame-header';

  // ドラッグ用ハンドル
  const handle = document.createElement('span');
  handle.className = 'group-frame-handle';
  handle.innerHTML = '⠿';
  handle.title = 'ここをドラッグして班を移動';
  handle.setAttribute('data-html2canvas-ignore', 'true');

  // 編集可能な班名ラベル
  const label = document.createElement('span');
  label.className = 'group-frame-label';
  label.contentEditable = 'true';
  label.textContent = groupData.name;
  label.title = 'クリックで名前を編集';
  
  label.addEventListener('blur', () => {
    groupData.name = label.textContent.trim() || `班 ${groupData.id}`;
    label.textContent = groupData.name;
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    updateHistoryAfterSwap(rows, cols);
  });

  label.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      label.blur();
    }
  });

  // コントロール（パレット＆削除ボタン）のコンテナ
  const controls = document.createElement('div');
  controls.className = 'group-frame-controls';

  // パレットトグルボタン (🎨)
  const paletteBtn = document.createElement('button');
  paletteBtn.className = 'group-frame-palette-btn';
  paletteBtn.innerHTML = '🎨';
  paletteBtn.title = '枠の色を変更';
  paletteBtn.setAttribute('data-html2canvas-ignore', 'true');

  // カラーセレクターポップアップ
  const colorSelector = document.createElement('div');
  colorSelector.className = 'group-color-selector';
  colorSelector.style.display = 'none';
  colorSelector.setAttribute('data-html2canvas-ignore', 'true');
  
  // ポップアップ自体をクリックしても閉じないようにする（ネイティブカラーピッカー保護）
  colorSelector.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // プリセットカラー
  const presets = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
  presets.forEach(color => {
    const chip = document.createElement('div');
    chip.className = 'color-chip';
    chip.style.backgroundColor = color;
    chip.title = color;
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      groupData.color = color;
      applyGroupFrameColor(frame, color);
      colorSelector.style.display = 'none';
      
      const rows = parseInt(els.seatingRows.value) || 0;
      const cols = parseInt(els.seatingCols.value) || 0;
      updateHistoryAfterSwap(rows, cols);
    });
    colorSelector.appendChild(chip);
  });

  // カスタムカラー (虹色チップに隠し input[type="color"])
  const customChip = document.createElement('div');
  customChip.className = 'color-chip custom-picker-wrapper';
  customChip.title = 'カスタム色を選択';

  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.className = 'group-frame-color-picker';
  colorPicker.value = groupData.color || '#3b82f6';

  colorPicker.addEventListener('input', (e) => {
    const newColor = e.target.value;
    groupData.color = newColor;
    applyGroupFrameColor(frame, newColor);
  });

  colorPicker.addEventListener('change', () => {
    const rows = parseInt(els.seatingRows.value) || 0;
    const cols = parseInt(els.seatingCols.value) || 0;
    updateHistoryAfterSwap(rows, cols);
  });

  customChip.appendChild(colorPicker);
  colorSelector.appendChild(customChip);

  // パレットボタンクリックでトグル
  paletteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = colorSelector.style.display === 'flex';
    document.querySelectorAll('.group-color-selector').forEach(sel => {
      sel.style.display = 'none';
    });
    colorSelector.style.display = isVisible ? 'none' : 'flex';
  });

  // 削除ボタン
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'group-frame-delete';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'この枠を削除';
  deleteBtn.setAttribute('data-html2canvas-ignore', 'true');
  
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`班の枠 「${groupData.name}」 を削除しますか？ (中の席カードは削除されません)`)) {
      if (state.activeGroupId === groupData.id) {
        setActiveGroup(null);
      }
      frame.remove();
      state.freeGroups = state.freeGroups.filter(g => g.id !== groupData.id);
      
      const rows = parseInt(els.seatingRows.value) || 0;
      const cols = parseInt(els.seatingCols.value) || 0;
      updateHistoryAfterSwap(rows, cols);
    }
  });

  // ドキュメントクリックで閉じる
  const closeSelector = () => {
    colorSelector.style.display = 'none';
  };
  document.addEventListener('click', closeSelector);

  header.appendChild(handle);
  header.appendChild(label);
  controls.appendChild(paletteBtn);
  controls.appendChild(deleteBtn);
  header.appendChild(controls);
  frame.appendChild(header);
  frame.appendChild(colorSelector);

  // リサイズ用ハンドルエリア (右下)
  const resizeArea = document.createElement('div');
  resizeArea.className = 'group-frame-resize-area';
  frame.appendChild(resizeArea);

  // 初回の色適用
  applyGroupFrameColor(frame, groupData.color || '#3b82f6');

  // Resize end detection to save dimensions
  let resizeTimeout;
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const { width, height } = entry.contentRect;
        if (Math.abs(groupData.w - width) > 5 || Math.abs(groupData.h - height) > 5) {
          groupData.w = Math.round(width);
          groupData.h = Math.round(height);
          const rows = parseInt(els.seatingRows.value) || 0;
          const cols = parseInt(els.seatingCols.value) || 0;
          updateHistoryAfterSwap(rows, cols);
        }
      }, 300);
    }
  });
  resizeObserver.observe(frame);

  initElementDrag(frame, false);
  container.appendChild(frame);
}

function toggleFreeLayoutMode(mode) {
  state.seatingMode = mode;
  setActiveGroup(null);
  
  const rows = parseInt(els.seatingRows.value) || 0;
  const cols = parseInt(els.seatingCols.value) || 0;

  if (mode === 'free') {
    // UI states
    els.btnSeatingGridMode.classList.remove('active');
    els.btnSeatingGridMode.style.color = 'var(--text-secondary)';
    els.btnSeatingFreeMode.classList.add('active');
    els.btnSeatingFreeMode.style.color = '#ffffff';

    els.btnAddGroupFrame.style.display = 'flex';
    els.btnResetLayout.style.display = 'flex';
    els.seatingInstructionHint.textContent = '💡 席カードや班の枠をドラッグして、自由なレイアウトやチーム分けをデザインできます！';

    // UI Container adjustments
    els.seatingScrollContainer.classList.add('free-layout-canvas');
    els.seatingGrid.style.display = 'block'; 
    els.seatingGrid.style.width = '100%';
    els.seatingGrid.style.minWidth = '800px';
    els.seatingGrid.style.height = '500px';
    
  } else {
    // UI states
    els.btnSeatingGridMode.classList.add('active');
    els.btnSeatingGridMode.style.color = '#ffffff';
    els.btnSeatingFreeMode.classList.remove('active');
    els.btnSeatingFreeMode.style.color = 'var(--text-secondary)';

    els.btnAddGroupFrame.style.display = 'none';
    els.btnResetLayout.style.display = 'none';
    els.seatingInstructionHint.textContent = '💡 席をドラッグ＆ドロップ、または2つの席を順番にタップすることで、自由に配置を入れ替えられます！';

    // UI Container adjustments
    els.seatingScrollContainer.classList.remove('free-layout-canvas');
    els.seatingGrid.style.display = 'grid'; 
    els.seatingGrid.style.width = 'max-content';
    els.seatingGrid.style.minWidth = 'unset';
    els.seatingGrid.style.height = 'auto';
  }

  // Save mode to current active history event
  if (state.history.length > 0) {
    state.history[state.history.length - 1].seatingMode = mode;
  }

  showResult();
  updateHistoryAfterSwap(rows, cols);
}

function resetToGridLayout() {
  state.freeSeats = [];
  state.freeGroups = [];
  state.seatingMode = 'grid';
  state.nextGroupId = 1;
  setActiveGroup(null);
  
  // Remove all group frames from DOM
  document.querySelectorAll('.group-frame').forEach(f => f.remove());

  // UI state adjustment
  els.btnSeatingGridMode.classList.add('active');
  els.btnSeatingGridMode.style.color = '#ffffff';
  els.btnSeatingFreeMode.classList.remove('active');
  els.btnSeatingFreeMode.style.color = 'var(--text-secondary)';

  els.btnAddGroupFrame.style.display = 'none';
  els.btnResetLayout.style.display = 'none';
  els.seatingInstructionHint.textContent = '💡 席をドラッグ＆ドロップ、または2つの席を順番にタップすることで、自由に配置を入れ替えられます！';

  els.seatingScrollContainer.classList.remove('free-layout-canvas');
  els.seatingGrid.style.display = 'grid';
  els.seatingGrid.style.width = 'max-content';
  els.seatingGrid.style.minWidth = 'unset';
  els.seatingGrid.style.height = 'auto';

  if (state.history.length > 0) {
    state.history[state.history.length - 1].seatingMode = 'grid';
    state.history[state.history.length - 1].freeSeats = [];
    state.history[state.history.length - 1].freeGroups = [];
  }

  showResult();
  
  const rows = parseInt(els.seatingRows.value) || 0;
  const cols = parseInt(els.seatingCols.value) || 0;
  updateHistoryAfterSwap(rows, cols);
}

// Undo / Redo core logic
function getSnapshot() {
  return {
    finalSeatingResult: JSON.parse(JSON.stringify(state.finalSeatingResult)),
    freeSeats: JSON.parse(JSON.stringify(state.freeSeats)),
    freeGroups: JSON.parse(JSON.stringify(state.freeGroups)),
    seatingMode: state.seatingMode,
    nextGroupId: state.nextGroupId,
    activeGroupId: state.activeGroupId
  };
}

function applySnapshot(snapshot) {
  state.finalSeatingResult = JSON.parse(JSON.stringify(snapshot.finalSeatingResult));
  state.freeSeats = JSON.parse(JSON.stringify(snapshot.freeSeats));
  state.freeGroups = JSON.parse(JSON.stringify(snapshot.freeGroups));
  state.seatingMode = snapshot.seatingMode;
  state.nextGroupId = snapshot.nextGroupId;
  state.activeGroupId = snapshot.activeGroupId !== undefined ? snapshot.activeGroupId : null;

  // 再描画
  showResult();
  
  // Set active group visually
  setActiveGroup(state.activeGroupId);

  // 履歴更新 (Undoスタックへの重複プッシュは防ぐ)
  const rows = parseInt(els.seatingRows.value) || 0;
  const cols = parseInt(els.seatingCols.value) || 0;
  updateHistoryAfterSwap(rows, cols, false);
}

function saveStateForUndo() {
  const snapshot = getSnapshot();

  // 重複プッシュの防止
  if (undoStack.length > 0) {
    const last = undoStack[undoStack.length - 1];
    if (JSON.stringify(last) === JSON.stringify(snapshot)) {
      return;
    }
  }

  undoStack.push(snapshot);
  if (undoStack.length > 30) {
    undoStack.shift();
  }
  redoStack = []; // 新たな操作がされたためやり直しスタックはクリア
  updateUndoRedoButtons();
}

function handleUndo() {
  if (undoStack.length <= 1) return;

  const current = undoStack.pop();
  redoStack.push(current);

  const previous = undoStack[undoStack.length - 1];
  applySnapshot(previous);
  updateUndoRedoButtons();
}

function handleRedo() {
  if (redoStack.length === 0) return;

  const next = redoStack.pop();
  undoStack.push(next);

  applySnapshot(next);
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (els.btnUndo && els.btnRedo) {
    els.btnUndo.disabled = undoStack.length <= 1;
    els.btnRedo.disabled = redoStack.length === 0;
  }
}

function downloadSeatingImage() {
  const captureArea = document.getElementById('seating-capture-area');
  const scrollContainer = els.seatingScrollContainer;
  if (!captureArea || !scrollContainer) return;

  // 選択状態の枠があれば事前に解除する
  setActiveGroup(null);

  // ボタンをローディング状態にする
  const btn = els.btnDownloadSeating;
  if (!btn) return;
  const originalBtnHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `⏳ 保存中...`;

  setTimeout(() => {
    // スクロールコンテナがクリップされるのを防ぐため、一時的にオーバーフローを可視化する
    const origOverflowX = scrollContainer.style.overflowX;
    const origOverflowY = scrollContainer.style.overflowY;
    const origOverflow = scrollContainer.style.overflow;
    
    scrollContainer.style.overflow = 'visible';
    
    // テーマに合わせた確実な背景色を取得（CSS変数にコメントが含まれる場合のパースエラーを防ぐ）
    const themeBg = state.theme === 'light' ? '#f1f5f9' : '#0a0e1a';
    
    // キャプチャエリアに一時的に背景色を設定（透過要素の白飛びを確実に防ぐ）
    const origBgColor = captureArea.style.backgroundColor;
    captureArea.style.backgroundColor = themeBg;

    html2canvas(captureArea, {
      backgroundColor: themeBg,
      scale: 2, // 高解像度で書き出し
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        // キャプチャ時（クローン時）にアニメーションを無効化し、白飛びを防ぐ
        const style = clonedDoc.createElement('style');
        style.innerHTML = '* { animation: none !important; transition: none !important; transform: none !important; opacity: 1 !important; } .seat-card { animation: none !important; transform: none !important; opacity: 1 !important; } .empty-seat { background: transparent !important; }';
        clonedDoc.head.appendChild(style);
      }
    }).then(canvas => {
      // スタイルを元に戻す
      scrollContainer.style.overflow = origOverflow;
      scrollContainer.style.overflowX = origOverflowX;
      scrollContainer.style.overflowY = origOverflowY;
      captureArea.style.backgroundColor = origBgColor;

      // ボタンを元に戻す
      btn.disabled = false;
      btn.innerHTML = originalBtnHTML;

      // ダウンロードリンクを生成してクリック
      const link = document.createElement('a');
      const date = new Date();
      const dateStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}${date.getMinutes().toString().padStart(2,'0')}`;
      link.download = `座席配置_${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(err => {
      console.error('Image export failed:', err);
      // エラー時もスタイルとボタンを復元
      scrollContainer.style.overflow = origOverflow;
      scrollContainer.style.overflowX = origOverflowX;
      scrollContainer.style.overflowY = origOverflowY;
      captureArea.style.backgroundColor = origBgColor;
      btn.disabled = false;
      btn.innerHTML = originalBtnHTML;
      alert('画像の保存に失敗しました。ブラウザのセキュリティ制限等をご確認ください。');
    });
  }, 150); // アクティブ解除のアニメーション完了を待つ時間
}

// Start
init();
