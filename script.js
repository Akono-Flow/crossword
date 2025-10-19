// Main Application Class
        class CrosswordApp {
            constructor() {
                // App state
                this.words = [];
                this.database = [];
                this.currentPuzzle = null;
                this.settings = {
                    showTimer: true,
                    autoCheck: false,
                    highlightWord: true,
                    gridSize: 15,
                    maxWords: 20,
                    densePuzzles: false,
                    autoSave: true,
                    preventDuplicates: true
                };
                this.gameTimer = null;
                this.gameTime = 0;
                this.selectedCell = null;
                this.direction = 'across'; // 'across' or 'down'
                
                // Initialize the app
                this.loadSettings();
                this.loadDatabase();
                this.initEventListeners();
                this.updateSettingsUI();
            }
            
            // Initialize all event listeners
            initEventListeners() {
                // Tab navigation
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
                });
                
                // Create tab events
                document.getElementById('add-word').addEventListener('click', () => this.addWord());
                document.getElementById('generate-crossword').addEventListener('click', () => this.generateCrossword());
                document.getElementById('clear-words').addEventListener('click', () => this.clearWords());
                document.getElementById('export-crossword').addEventListener('click', () => this.showExportModal('crossword'));
                document.getElementById('import-crossword').addEventListener('click', () => this.showImportModal('crossword'));
                document.getElementById('print-crossword').addEventListener('click', () => this.printCrossword());
                
                // Word input events
                document.getElementById('word-input').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('clue-input').focus();
                    }
                });
                
                document.getElementById('clue-input').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.addWord();
                    }
                });
                
                // Play tab events
                document.getElementById('new-game').addEventListener('click', () => this.startNewGame());
                document.getElementById('check-answers').addEventListener('click', () => this.checkAnswers());
                document.getElementById('reveal-answer').addEventListener('click', () => this.revealAnswer());
                document.getElementById('reset-puzzle').addEventListener('click', () => this.resetPuzzle());
                
                // Database tab events
                document.getElementById('db-add-word').addEventListener('click', () => this.addWordToDatabase());
                document.getElementById('search-btn').addEventListener('click', () => this.searchDatabase());
                document.getElementById('search-database').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.searchDatabase();
                    }
                });
                document.getElementById('import-database').addEventListener('click', () => this.showImportModal('database'));
                document.getElementById('export-database').addEventListener('click', () => this.showExportModal('database'));
                document.getElementById('clear-database').addEventListener('click', () => this.clearDatabase());
                
                // Settings tab events
                document.getElementById('show-timer-setting').addEventListener('change', (e) => {
                    this.settings.showTimer = e.target.checked;
                    this.saveSettings();
                });
                
                document.getElementById('auto-check-setting').addEventListener('change', (e) => {
                    this.settings.autoCheck = e.target.checked;
                    this.saveSettings();
                });
                
                document.getElementById('highlight-word-setting').addEventListener('change', (e) => {
                    this.settings.highlightWord = e.target.checked;
                    this.saveSettings();
                });
                
                document.getElementById('dense-puzzles-setting').addEventListener('change', (e) => {
                    this.settings.densePuzzles = e.target.checked;
                    this.saveSettings();
                });
                
                document.getElementById('auto-save-setting').addEventListener('change', (e) => {
                    this.settings.autoSave = e.target.checked;
                    this.saveSettings();
                });
                
                document.getElementById('prevent-duplicates-setting').addEventListener('change', (e) => {
                    this.settings.preventDuplicates = e.target.checked;
                    this.saveSettings();
                });
                
                const gridSizeSlider = document.getElementById('grid-size-slider');
                gridSizeSlider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    this.settings.gridSize = parseInt(value);
                    gridSizeSlider.nextElementSibling.textContent = `${value} x ${value}`;
                    this.saveSettings();
                });
                
                const maxWordsSlider = document.getElementById('max-words-slider');
                maxWordsSlider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    this.settings.maxWords = parseInt(value);
                    maxWordsSlider.nextElementSibling.textContent = `${value} words`;
                    this.saveSettings();
                });
                
                document.getElementById('backup-data').addEventListener('click', () => this.backupData());
                document.getElementById('restore-data').addEventListener('click', () => this.restoreData());
                
                // Modal events
                document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.closeModal());
                });
                
                document.getElementById('copy-export').addEventListener('click', () => this.copyExportText());
                document.getElementById('confirm-import').addEventListener('click', () => this.processImport());
                
                // Toast event
                document.querySelector('.toast-close').addEventListener('click', () => {
                    document.getElementById('toast').classList.remove('show');
                });
            }
            
            // Switch between tabs
            switchTab(tabId) {
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                // Additional actions when switching tabs
                if (tabId === 'database') {
                    this.renderDatabaseTable();
                } else if (tabId === 'play' && !this.currentPuzzle) {
                    this.startNewGame();
                }
            }
            
            // Add a word to the current word list
            addWord() {
                const wordInput = document.getElementById('word-input');
                const clueInput = document.getElementById('clue-input');
                
                const word = wordInput.value.trim().toUpperCase();
                const clue = clueInput.value.trim();
                
                if (!word || !clue) {
                    this.showToast('Please enter both a word and a clue.', 'error');
                    return;
                }
                
                // Check if word contains only letters
                if (!/^[A-Z]+$/.test(word)) {
                    this.showToast('Words must contain only letters (A-Z).', 'error');
                    return;
                }
                
                // Add word to list
                this.words.push({ word, clue });
                this.renderWordsList();
                
                // Clear inputs
                wordInput.value = '';
                clueInput.value = '';
                wordInput.focus();
                
                // Auto-save to database if setting is enabled
                if (this.settings.autoSave) {
                    this.addToDatabase(word, clue);
                }
            }
            
            // Render the current words list
            renderWordsList() {
                const wordsList = document.getElementById('words-list');
                wordsList.innerHTML = '';
                
                if (this.words.length === 0) {
                    wordsList.innerHTML = `
                        <div class="word-item" style="color: var(--text-secondary); font-style: italic;">
                            No words added yet. Add words above to start creating your crossword.
                        </div>
                    `;
                    return;
                }
                
                this.words.forEach((item, index) => {
                    const wordItem = document.createElement('div');
                    wordItem.className = 'word-item';
                    wordItem.innerHTML = `
                        <div class="word-text">${item.word}</div>
                        <div class="word-clue">${item.clue}</div>
                        <button class="btn-danger" data-index="${index}">×</button>
                    `;
                    
                    // Add delete event listener
                    wordItem.querySelector('button').addEventListener('click', (e) => {
                        const index = parseInt(e.target.dataset.index);
                        this.words.splice(index, 1);
                        this.renderWordsList();
                    });
                    
                    wordsList.appendChild(wordItem);
                });
            }
            
            // Clear the word list
            clearWords() {
                if (this.words.length === 0) return;
                
                if (confirm('Are you sure you want to clear all words?')) {
                    this.words = [];
                    this.renderWordsList();
                    document.getElementById('crossword-preview-container').style.display = 'none';
                }
            }
            
            // Generate a crossword puzzle from the current word list
            generateCrossword() {
                if (this.words.length < 3) {
                    this.showToast('Please add at least 3 words to create a crossword puzzle.', 'error');
                    return;
                }
                
                this.showLoading();
                
                // Use setTimeout to allow the loading spinner to appear
                setTimeout(() => {
                    try {
                        // Create a new crossword puzzle
                        const crossword = new CrosswordGenerator(
                            this.words,
                            this.settings.gridSize,
                            this.settings.densePuzzles
                        );
                        
                        const puzzle = crossword.generate();
                        
                        if (!puzzle) {
                            this.hideLoading();
                            this.showToast('Could not generate a crossword with these words. Try adding more words or adjusting the grid size.', 'error');
                            return;
                        }
                        
                        this.currentPuzzle = puzzle;
                        this.renderCrossword(puzzle, 'create');
                        document.getElementById('crossword-preview-container').style.display = 'flex';
                        
                        // Update print title
                        const puzzleTitle = document.getElementById('puzzle-title').value.trim() || 'Crossword Puzzle';
                        document.getElementById('print-title').textContent = puzzleTitle;
                        
                        this.hideLoading();
                        this.showToast('Crossword puzzle generated successfully!', 'success');
                    } catch (error) {
                        console.error('Error generating crossword:', error);
                        this.hideLoading();
                        this.showToast('Error generating crossword. Please try again.', 'error');
                    }
                }, 100);
            }
            
            // Render a crossword puzzle to the grid
            renderCrossword(puzzle, mode = 'create') {
                const prefix = mode === 'play' ? 'play-' : '';
                const gridContainer = document.getElementById(`${prefix}crossword-grid`);
                const acrossClues = document.getElementById(`${prefix}across-clues`);
                const downClues = document.getElementById(`${prefix}down-clues`);
                
                // Clear previous content
                gridContainer.innerHTML = '';
                acrossClues.innerHTML = '';
                downClues.innerHTML = '';
                
                // Set grid dimensions
                const gridSize = puzzle.grid.length;
                gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, var(--grid-cell-size))`;
                gridContainer.style.gridTemplateRows = `repeat(${gridSize}, var(--grid-cell-size))`;
                
                // Render grid cells
                for (let y = 0; y < gridSize; y++) {
                    for (let x = 0; x < gridSize; x++) {
                        const cell = document.createElement('div');
                        cell.className = 'cell';
                        cell.dataset.x = x;
                        cell.dataset.y = y;
                        
                        if (puzzle.grid[y][x] === null) {
                            cell.classList.add('empty');
                        } else {
                            // Check if cell has a number
                            const cellNumber = puzzle.getCellNumber(x, y);
                            if (cellNumber !== null) {
                                const numberSpan = document.createElement('span');
                                numberSpan.className = 'cell-number';
                                numberSpan.textContent = cellNumber;
                                cell.appendChild(numberSpan);
                            }
                            
                            // Add input field for playing
                            if (mode === 'play') {
                                const input = document.createElement('input');
                                input.className = 'cell-input';
                                input.type = 'text';
                                input.maxLength = 1;
                                input.dataset.x = x;
                                input.dataset.y = y;
                                
                                // Add event listeners for gameplay
                                input.addEventListener('focus', (e) => this.onCellFocus(e.target));
                                input.addEventListener('input', (e) => this.onCellInput(e.target));
                                input.addEventListener('keydown', (e) => this.onCellKeyDown(e));
                                
                                cell.appendChild(input);
                            } else {
                                // For create mode, just show the letter
                                const letter = document.createElement('span');
                                letter.className = 'cell-input';
                                letter.textContent = puzzle.grid[y][x];
                                cell.appendChild(letter);
                            }
                        }
                        
                        gridContainer.appendChild(cell);
                    }
                }
                
                // Render clues
                puzzle.clues.across.forEach(clue => {
                    const clueItem = document.createElement('div');
                    clueItem.className = 'clue-item';
                    clueItem.dataset.number = clue.number;
                    clueItem.dataset.direction = 'across';
                    clueItem.innerHTML = `<span class="clue-number">${clue.number}.</span> ${clue.clue}`;
                    
                    if (mode === 'play') {
                        clueItem.addEventListener('click', () => this.focusClue(clue.number, 'across'));
                    }
                    
                    acrossClues.appendChild(clueItem);
                });
                
                puzzle.clues.down.forEach(clue => {
                    const clueItem = document.createElement('div');
                    clueItem.className = 'clue-item';
                    clueItem.dataset.number = clue.number;
                    clueItem.dataset.direction = 'down';
                    clueItem.innerHTML = `<span class="clue-number">${clue.number}.</span> ${clue.clue}`;
                    
                    if (mode === 'play') {
                        clueItem.addEventListener('click', () => this.focusClue(clue.number, 'down'));
                    }
                    
                    downClues.appendChild(clueItem);
                });
            }
            
            // Print the current crossword puzzle
            printCrossword() {
                if (!this.currentPuzzle) {
                    this.showToast('Please generate a crossword first.', 'error');
                    return;
                }
                
                window.print();
            }
            
            // Start a new game
            startNewGame() {
                this.stopTimer();
                this.gameTime = 0;
                this.updateTimerDisplay();
                
                // Get difficulty setting
                const difficulty = document.getElementById('difficulty').value;
                let wordCount;
                
                switch (difficulty) {
                    case 'easy':
                        wordCount = this.getRandomInt(5, 8);
                        break;
                    case 'medium':
                        wordCount = this.getRandomInt(9, 12);
                        break;
                    case 'hard':
                        wordCount = this.getRandomInt(13, 20);
                        break;
                    default:
                        wordCount = 10;
                }
                
                // Check if we have enough words in the database
                if (this.database.length < wordCount) {
                    this.showToast(`Not enough words in the database. Please add at least ${wordCount} words.`, 'error');
                    return;
                }
                
                this.showLoading();
                
                // Use setTimeout to allow the loading spinner to appear
                setTimeout(() => {
                    // Select random words from the database
                    const shuffled = [...this.database].sort(() => 0.5 - Math.random());
                    const selectedWords = shuffled.slice(0, wordCount);
                    
                    try {
                        // Create a new crossword puzzle
                        const crossword = new CrosswordGenerator(
                            selectedWords,
                            this.settings.gridSize,
                            this.settings.densePuzzles
                        );
                        
                        const puzzle = crossword.generate();
                        
                        if (!puzzle) {
                            this.hideLoading();
                            this.showToast('Could not generate a crossword. Please try again or add more words to the database.', 'error');
                            return;
                        }
                        
                        this.currentPuzzle = puzzle;
                        this.renderCrossword(puzzle, 'play');
                        
                        // Start timer if enabled
                        if (this.settings.showTimer) {
                            this.startTimer();
                        }
                        
                        document.getElementById('game-message').style.display = 'none';
                        
                        this.hideLoading();
                        this.showToast('New puzzle generated!', 'success');
                    } catch (error) {
                        console.error('Error generating crossword:', error);
                        this.hideLoading();
                        this.showToast('Error generating crossword. Please try again.', 'error');
                    }
                }, 100);
            }
            
            // Check the current answers
            checkAnswers() {
                if (!this.currentPuzzle) return;
                
                let correct = 0;
                let total = 0;
                let isComplete = true;
                
                const inputs = document.querySelectorAll('#play-crossword-grid .cell-input');
                
                inputs.forEach(input => {
                    const x = parseInt(input.dataset.x);
                    const y = parseInt(input.dataset.y);
                    const correctLetter = this.currentPuzzle.grid[y][x];
                    const userLetter = input.value.toUpperCase();
                    
                    if (correctLetter) {
                        total++;
                        
                        if (userLetter === '') {
                            isComplete = false;
                        } else if (userLetter === correctLetter) {
                            correct++;
                            input.style.color = 'var(--success)';
                        } else {
                            input.style.color = 'var(--error)';
                        }
                    }
                });
                
                // Display message
                const gameMessage = document.getElementById('game-message');
                gameMessage.style.display = 'block';
                
                if (!isComplete) {
                    gameMessage.textContent = `Progress: ${correct}/${total} letters correct. Keep going!`;
                    gameMessage.className = 'message';
                } else if (correct === total) {
                    gameMessage.textContent = 'Congratulations! You completed the crossword correctly!';
                    gameMessage.className = 'message success';
                    this.stopTimer();
                } else {
                    gameMessage.textContent = `You have ${correct}/${total} letters correct. Try again!`;
                    gameMessage.className = 'message error';
                }
            }
            
            // Reveal the answer
            revealAnswer() {
                if (!this.currentPuzzle) return;
                
                if (confirm('Are you sure you want to reveal the answer? This will end the current game.')) {
                    const inputs = document.querySelectorAll('#play-crossword-grid .cell-input');
                    
                    inputs.forEach(input => {
                        const x = parseInt(input.dataset.x);
                        const y = parseInt(input.dataset.y);
                        const correctLetter = this.currentPuzzle.grid[y][x];
                        
                        if (correctLetter) {
                            input.value = correctLetter;
                            input.style.color = 'var(--accent)';
                            input.disabled = true;
                        }
                    });
                    
                    this.stopTimer();
                    
                    // Display message
                    const gameMessage = document.getElementById('game-message');
                    gameMessage.style.display = 'block';
                    gameMessage.textContent = 'The solution has been revealed.';
                    gameMessage.className = 'message';
                }
            }
            
            // Reset the current puzzle
            resetPuzzle() {
                if (!this.currentPuzzle) return;
                
                const inputs = document.querySelectorAll('#play-crossword-grid .cell-input');
                
                inputs.forEach(input => {
                    input.value = '';
                    input.style.color = 'var(--text-primary)';
                    input.disabled = false;
                });
                
                // Reset timer
                this.gameTime = 0;
                this.updateTimerDisplay();
                
                if (this.settings.showTimer) {
                    this.startTimer();
                }
                
                // Hide message
                document.getElementById('game-message').style.display = 'none';
            }
            
            // Handle cell focus
            onCellFocus(cell) {
                // Set the selected cell
                this.selectedCell = cell;
                
                // Remove highlight from all cells
                document.querySelectorAll('#play-crossword-grid .cell').forEach(cell => {
                    cell.classList.remove('selected', 'highlighted');
                });
                
                // Get the cell's coordinates
                const x = parseInt(cell.dataset.x);
                const y = parseInt(cell.dataset.y);
                
                // Get the cell's parent
                const parentCell = cell.closest('.cell');
                parentCell.classList.add('selected');
                
                // Highlight the current word if setting is enabled
                if (this.settings.highlightWord) {
                    this.highlightWord(x, y);
                }
                
                // Update active clue
                this.updateActiveClue(x, y);
            }
            
            // Handle cell input
            onCellInput(cell) {
                // Convert to uppercase
                cell.value = cell.value.toUpperCase();
                
                // Auto-check if setting is enabled
                if (this.settings.autoCheck) {
                    const x = parseInt(cell.dataset.x);
                    const y = parseInt(cell.dataset.y);
                    const correctLetter = this.currentPuzzle.grid[y][x];
                    
                    if (cell.value === '') {
                        cell.style.color = 'var(--text-primary)';
                    } else if (cell.value === correctLetter) {
                        cell.style.color = 'var(--success)';
                    } else {
                        cell.style.color = 'var(--error)';
                    }
                }
                
                // Move to next cell if direction is across
                if (this.direction === 'across' && cell.value.length === 1) {
                    this.moveToNextCell();
                }
            }
            
            // Handle keyboard navigation
            onCellKeyDown(event) {
                const cell = event.target;
                const key = event.key;
                
                // Get the cell's coordinates
                const x = parseInt(cell.dataset.x);
                const y = parseInt(cell.dataset.y);
                
                switch (key) {
                    case 'ArrowUp':
                        this.direction = 'down';
                        this.moveCursor(x, y - 1);
                        event.preventDefault();
                        break;
                    case 'ArrowDown':
                        this.direction = 'down';
                        this.moveCursor(x, y + 1);
                        event.preventDefault();
                        break;
                    case 'ArrowLeft':
                        this.direction = 'across';
                        this.moveCursor(x - 1, y);
                        event.preventDefault();
                        break;
                    case 'ArrowRight':
                        this.direction = 'across';
                        this.moveCursor(x + 1, y);
                        event.preventDefault();
                        break;
                    case 'Backspace':
                        if (cell.value === '') {
                            // Move to previous cell if empty
                            if (this.direction === 'across') {
                                this.moveCursor(x - 1, y);
                            } else {
                                this.moveCursor(x, y - 1);
                            }
                        }
                        break;
                    case 'Tab':
                        // Move to next word
                        if (event.shiftKey) {
                            this.moveToPreviousWord();
                        } else {
                            this.moveToNextWord();
                        }
                        event.preventDefault();
                        break;
                    case ' ':
                        // Toggle direction
                        this.direction = this.direction === 'across' ? 'down' : 'across';
                        this.highlightWord(x, y);
                        this.updateActiveClue(x, y);
                        event.preventDefault();
                        break;
                }
            }
            
            // Move cursor to specified coordinates
            moveCursor(x, y) {
                if (!this.currentPuzzle) return;
                
                const gridSize = this.currentPuzzle.grid.length;
                
                // Ensure coordinates are within bounds
                if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
                    return;
                }
                
                // Check if the cell is fillable
                if (this.currentPuzzle.grid[y][x] !== null) {
                    const nextInput = document.querySelector(`#play-crossword-grid .cell-input[data-x="${x}"][data-y="${y}"]`);
                    if (nextInput) {
                        nextInput.focus();
                    }
                }
            }
            
            // Move to the next cell in the current direction
            moveToNextCell() {
                if (!this.selectedCell) return;
                
                const x = parseInt(this.selectedCell.dataset.x);
                const y = parseInt(this.selectedCell.dataset.y);
                
                if (this.direction === 'across') {
                    this.moveCursor(x + 1, y);
                } else {
                    this.moveCursor(x, y + 1);
                }
            }
            
            // Move to the previous cell in the current direction
            moveToPreviousCell() {
                if (!this.selectedCell) return;
                
                const x = parseInt(this.selectedCell.dataset.x);
                const y = parseInt(this.selectedCell.dataset.y);
                
                if (this.direction === 'across') {
                    this.moveCursor(x - 1, y);
                } else {
                    this.moveCursor(x, y - 1);
                }
            }
            
            // Move to the next word
            moveToNextWord() {
                if (!this.currentPuzzle) return;
                
                // Get all clues in order
                const allClues = [
                    ...this.currentPuzzle.clues.across.map(c => ({ ...c, direction: 'across' })),
                    ...this.currentPuzzle.clues.down.map(c => ({ ...c, direction: 'down' }))
                ].sort((a, b) => a.number - b.number);
                
                // Find current clue
                const currentDirection = this.direction;
                const currentClue = this.getCurrentClue();
                
                if (!currentClue) return;
                
                const currentIndex = allClues.findIndex(
                    c => c.number === currentClue.number && c.direction === currentDirection
                );
                
                // Get next clue
                const nextIndex = (currentIndex + 1) % allClues.length;
                const nextClue = allClues[nextIndex];
                
                this.focusClue(nextClue.number, nextClue.direction);
            }
            
            // Move to the previous word
            moveToPreviousWord() {
                if (!this.currentPuzzle) return;
                
                // Get all clues in order
                const allClues = [
                    ...this.currentPuzzle.clues.across.map(c => ({ ...c, direction: 'across' })),
                    ...this.currentPuzzle.clues.down.map(c => ({ ...c, direction: 'down' }))
                ].sort((a, b) => a.number - b.number);
                
                // Find current clue
                const currentDirection = this.direction;
                const currentClue = this.getCurrentClue();
                
                if (!currentClue) return;
                
                const currentIndex = allClues.findIndex(
                    c => c.number === currentClue.number && c.direction === currentDirection
                );
                
                // Get previous clue
                const prevIndex = (currentIndex - 1 + allClues.length) % allClues.length;
                const prevClue = allClues[prevIndex];
                
                this.focusClue(prevClue.number, prevClue.direction);
            }
            
            // Focus on a specific clue
            focusClue(number, direction) {
                if (!this.currentPuzzle) return;
                
                // Set the direction
                this.direction = direction;
                
                // Find the clue
                const clue = this.currentPuzzle.clues[direction].find(c => c.number === number);
                if (!clue) return;
                
                // Get the starting cell
                const { x, y } = clue.position;
                
                // Focus the cell
                const cell = document.querySelector(`#play-crossword-grid .cell-input[data-x="${x}"][data-y="${y}"]`);
                if (cell) {
                    cell.focus();
                }
                
                // Highlight the clue
                document.querySelectorAll('.clue-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                const clueItem = document.querySelector(`.clue-item[data-number="${number}"][data-direction="${direction}"]`);
                if (clueItem) {
                    clueItem.classList.add('active');
                    clueItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
            
            // Get the current clue
            getCurrentClue() {
                if (!this.selectedCell || !this.currentPuzzle) return null;
                
                const x = parseInt(this.selectedCell.dataset.x);
                const y = parseInt(this.selectedCell.dataset.y);
                
                // Find the current word
                return this.currentPuzzle.getClueAt(x, y, this.direction);
            }
            
            // Highlight the current word
            highlightWord(x, y) {
                if (!this.currentPuzzle) return;
                
                // Find the current word
                const clue = this.currentPuzzle.getClueAt(x, y, this.direction);
                if (!clue) return;
                
                // Highlight all cells in the word
                const cells = this.currentPuzzle.getWordCells(clue.number, this.direction);
                cells.forEach(({ x, y }) => {
                    const cell = document.querySelector(`#play-crossword-grid .cell[data-x="${x}"][data-y="${y}"]`);
                    if (cell) {
                        cell.classList.add('highlighted');
                    }
                });
            }
            
            // Update the active clue highlight
            updateActiveClue(x, y) {
                document.querySelectorAll('.clue-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                const clue = this.currentPuzzle.getClueAt(x, y, this.direction);
                if (!clue) return;
                
                const clueItem = document.querySelector(`.clue-item[data-number="${clue.number}"][data-direction="${this.direction}"]`);
                if (clueItem) {
                    clueItem.classList.add('active');
                    clueItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
            
            // Start the game timer
            startTimer() {
                this.stopTimer();
                this.gameTimer = setInterval(() => {
                    this.gameTime++;
                    this.updateTimerDisplay();
                }, 1000);
            }
            
            // Stop the game timer
            stopTimer() {
                if (this.gameTimer) {
                    clearInterval(this.gameTimer);
                    this.gameTimer = null;
                }
            }
            
            // Update the timer display
            updateTimerDisplay() {
                const minutes = Math.floor(this.gameTime / 60).toString().padStart(2, '0');
                const seconds = (this.gameTime % 60).toString().padStart(2, '0');
                document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
            }
            
            // Add a word to the database
            addWordToDatabase() {
                const wordInput = document.getElementById('db-word-input');
                const clueInput = document.getElementById('db-clue-input');
                
                const word = wordInput.value.trim().toUpperCase();
                const clue = clueInput.value.trim();
                
                if (!word || !clue) {
                    this.showToast('Please enter both a word and a clue.', 'error');
                    return;
                }
                
                // Check if word contains only letters
                if (!/^[A-Z]+$/.test(word)) {
                    this.showToast('Words must contain only letters (A-Z).', 'error');
                    return;
                }
                
                if (this.addToDatabase(word, clue)) {
                    // Clear inputs
                    wordInput.value = '';
                    clueInput.value = '';
                    wordInput.focus();
                    
                    this.renderDatabaseTable();
                }
            }
            
            // Add a word to the database
            addToDatabase(word, clue) {
                // Check for duplicates if setting is enabled
                if (this.settings.preventDuplicates) {
                    const isDuplicate = this.database.some(item => item.word === word);
                    if (isDuplicate) {
                        this.showToast(`The word "${word}" is already in the database.`, 'error');
                        return false;
                    }
                }
                
                // Add to database
                this.database.push({ word, clue });
                this.saveDatabase();
                return true;
            }
            
            // Remove a word from the database
            removeFromDatabase(index) {
                this.database.splice(index, 1);
                this.saveDatabase();
                this.renderDatabaseTable();
            }
            
            // Edit a word in the database
            editDatabaseEntry(index, word, clue) {
                this.database[index] = { word, clue };
                this.saveDatabase();
                this.renderDatabaseTable();
            }
            
            // Render the database table
            renderDatabaseTable() {
                const tableBody = document.getElementById('database-table-body');
                tableBody.innerHTML = '';
                
                if (this.database.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td colspan="3" style="text-align: center; color: var(--text-secondary); font-style: italic;">
                            No words in the database. Add words above to start building your collection.
                        </td>
                    `;
                    tableBody.appendChild(row);
                    return;
                }
                
                this.database.forEach((item, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.word}</td>
                        <td>${item.clue}</td>
                        <td>
                            <button class="btn-secondary edit-db-item" data-index="${index}">Edit</button>
                            <button class="btn-danger delete-db-item" data-index="${index}">Delete</button>
                        </td>
                    `;
                    
                    // Add event listeners
                    row.querySelector('.edit-db-item').addEventListener('click', () => {
                        this.showEditModal(index, item.word, item.clue);
                    });
                    
                    row.querySelector('.delete-db-item').addEventListener('click', () => {
                        if (confirm(`Are you sure you want to delete "${item.word}" from the database?`)) {
                            this.removeFromDatabase(index);
                        }
                    });
                    
                    tableBody.appendChild(row);
                });
            }
            
            // Search the database
            searchDatabase() {
                const searchInput = document.getElementById('search-database').value.trim().toUpperCase();
                if (!searchInput) {
                    this.renderDatabaseTable();
                    return;
                }
                
                const filteredDatabase = this.database.filter(item => 
                    item.word.includes(searchInput) || 
                    item.clue.toUpperCase().includes(searchInput)
                );
                
                const tableBody = document.getElementById('database-table-body');
                tableBody.innerHTML = '';
                
                if (filteredDatabase.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td colspan="3" style="text-align: center; color: var(--text-secondary); font-style: italic;">
                            No matching words found. Try a different search term.
                        </td>
                    `;
                    tableBody.appendChild(row);
                    return;
                }
                
                filteredDatabase.forEach((item) => {
                    const index = this.database.findIndex(dbItem => dbItem.word === item.word && dbItem.clue === item.clue);
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.word}</td>
                        <td>${item.clue}</td>
                        <td>
                            <button class="btn-secondary edit-db-item" data-index="${index}">Edit</button>
                            <button class="btn-danger delete-db-item" data-index="${index}">Delete</button>
                        </td>
                    `;
                    
                    // Add event listeners
                    row.querySelector('.edit-db-item').addEventListener('click', () => {
                        this.showEditModal(index, item.word, item.clue);
                    });
                    
                    row.querySelector('.delete-db-item').addEventListener('click', () => {
                        if (confirm(`Are you sure you want to delete "${item.word}" from the database?`)) {
                            this.removeFromDatabase(index);
                        }
                    });
                    
                    tableBody.appendChild(row);
                });
            }
            
            // Clear the database
            clearDatabase() {
                if (confirm('Are you sure you want to clear the entire database? This cannot be undone.')) {
                    this.database = [];
                    this.saveDatabase();
                    this.renderDatabaseTable();
                    this.showToast('Database cleared successfully.', 'success');
                }
            }
            
            // Show the edit modal
            showEditModal(index, word, clue) {
                // Create a modal for editing
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.style.display = 'flex';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edit Word</h3>
                            <button class="close-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group">
                                <label for="edit-word">Word</label>
                                <input type="text" id="edit-word" value="${word}">
                            </div>
                            <div class="input-group">
                                <label for="edit-clue">Clue</label>
                                <input type="text" id="edit-clue" value="${clue}">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary close-modal-btn">Cancel</button>
                            <button id="save-edit" class="btn-primary">Save</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Add event listeners
                modal.querySelector('.close-modal').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                modal.querySelector('.close-modal-btn').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                modal.querySelector('#save-edit').addEventListener('click', () => {
                    const editedWord = document.getElementById('edit-word').value.trim().toUpperCase();
                    const editedClue = document.getElementById('edit-clue').value.trim();
                    
                    if (!editedWord || !editedClue) {
                        this.showToast('Please enter both a word and a clue.', 'error');
                        return;
                    }
                    
                    // Check if word contains only letters
                    if (!/^[A-Z]+$/.test(editedWord)) {
                        this.showToast('Words must contain only letters (A-Z).', 'error');
                        return;
                    }
                    
                    // Check for duplicates if setting is enabled and word changed
                    if (this.settings.preventDuplicates && editedWord !== word) {
                        const isDuplicate = this.database.some((item, i) => i !== index && item.word === editedWord);
                        if (isDuplicate) {
                            this.showToast(`The word "${editedWord}" is already in the database.`, 'error');
                            return;
                        }
                    }
                    
                    this.editDatabaseEntry(index, editedWord, editedClue);
                    document.body.removeChild(modal);
                    this.showToast('Word updated successfully.', 'success');
                });
            }
            
            // Show the import/export modal
            showExportModal(type) {
                const modal = document.getElementById('import-export-modal');
                const modalTitle = document.getElementById('modal-title');
                const exportContent = document.getElementById('export-content');
                const importContent = document.getElementById('import-content');
                const exportText = document.getElementById('export-text');
                
                // Configure modal for export
                modalTitle.textContent = type === 'crossword' ? 'Export Crossword' : 'Export Database';
                exportContent.style.display = 'block';
                importContent.style.display = 'none';
                document.getElementById('confirm-import').style.display = 'none';
                
                // Generate export data
                let exportData;
                
                if (type === 'crossword') {
                    if (!this.currentPuzzle) {
                        this.showToast('Please generate a crossword first.', 'error');
                        return;
                    }
                    
                    const puzzleTitle = document.getElementById('puzzle-title').value.trim() || 'Crossword Puzzle';
                    
                    exportData = {
                        type: 'crossword',
                        title: puzzleTitle,
                        words: this.words,
                        puzzle: this.currentPuzzle.serialize()
                    };
                } else {
                    exportData = {
                        type: 'database',
                        words: this.database
                    };
                }
                
                // Display export data
                exportText.value = JSON.stringify(exportData, null, 2);
                
                // Show modal
                modal.style.display = 'flex';
            }
            
            // Show the import modal
            showImportModal(type) {
                const modal = document.getElementById('import-export-modal');
                const modalTitle = document.getElementById('modal-title');
                const exportContent = document.getElementById('export-content');
                const importContent = document.getElementById('import-content');
                const importText = document.getElementById('import-text');
                const confirmImport = document.getElementById('confirm-import');
                
                // Configure modal for import
                modalTitle.textContent = type === 'crossword' ? 'Import Crossword' : 'Import Database';
                exportContent.style.display = 'none';
                importContent.style.display = 'block';
                confirmImport.style.display = 'block';
                
                // Clear import text
                importText.value = '';
                
                // Set data attribute for import type
                confirmImport.dataset.type = type;
                
                // Show modal
                modal.style.display = 'flex';
            }
            
            // Process the import data
            processImport() {
                const importText = document.getElementById('import-text').value.trim();
                const type = document.getElementById('confirm-import').dataset.type;
                
                if (!importText) {
                    this.showToast('Please enter import data.', 'error');
                    return;
                }
                
                try {
                    const importData = JSON.parse(importText);
                    
                    if (type === 'crossword') {
                        if (importData.type !== 'crossword') {
                            throw new Error('Invalid crossword data');
                        }
                        
                        this.words = importData.words;
                        document.getElementById('puzzle-title').value = importData.title || '';
                        this.renderWordsList();
                        
                        // Restore the puzzle
                        if (importData.puzzle) {
                            this.currentPuzzle = CrosswordPuzzle.deserialize(importData.puzzle);
                            this.renderCrossword(this.currentPuzzle, 'create');
                            document.getElementById('crossword-preview-container').style.display = 'flex';
                            
                            // Update print title
                            document.getElementById('print-title').textContent = importData.title || 'Crossword Puzzle';
                        }
                        
                        this.showToast('Crossword imported successfully!', 'success');
                    } else {
                        if (importData.type !== 'database') {
                            throw new Error('Invalid database data');
                        }
                        
                        if (confirm(`This will import ${importData.words.length} words into your database. Continue?`)) {
                            this.database = importData.words;
                            this.saveDatabase();
                            this.renderDatabaseTable();
                            this.showToast('Database imported successfully!', 'success');
                        }
                    }
                    
                    this.closeModal();
                } catch (error) {
                    console.error('Import error:', error);
                    this.showToast('Invalid import data. Please check the format and try again.', 'error');
                }
            }
            
            // Copy export text to clipboard
            copyExportText() {
                const exportText = document.getElementById('export-text');
                exportText.select();
                document.execCommand('copy');
                this.showToast('Copied to clipboard!', 'success');
            }
            
            // Close the modal
            closeModal() {
                document.getElementById('import-export-modal').style.display = 'none';
            }
            
            // Backup all app data
            backupData() {
                const backupData = {
                    database: this.database,
                    settings: this.settings
                };
                
                // Convert to JSON
                const backupJson = JSON.stringify(backupData, null, 2);
                
                // Create a download link
                const blob = new Blob([backupJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'crossword_backup_' + new Date().toISOString().split('T')[0] + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showToast('Backup created successfully!', 'success');
            }
            
            // Restore from a backup file
            restoreData() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const backupData = JSON.parse(event.target.result);
                            
                            if (!backupData.database || !backupData.settings) {
                                throw new Error('Invalid backup file');
                            }
                            
                            if (confirm('This will replace your current database and settings. Continue?')) {
                                this.database = backupData.database;
                                this.settings = backupData.settings;
                                this.saveDatabase();
                                this.saveSettings();
                                this.updateSettingsUI();
                                this.renderDatabaseTable();
                                this.showToast('Data restored successfully!', 'success');
                            }
                        } catch (error) {
                            console.error('Restore error:', error);
                            this.showToast('Invalid backup file. Please try again.', 'error');
                        }
                    };
                    reader.readAsText(file);
                });
                
                input.click();
            }
            
            // Update the settings UI
            updateSettingsUI() {
                document.getElementById('show-timer-setting').checked = this.settings.showTimer;
                document.getElementById('auto-check-setting').checked = this.settings.autoCheck;
                document.getElementById('highlight-word-setting').checked = this.settings.highlightWord;
                document.getElementById('dense-puzzles-setting').checked = this.settings.densePuzzles;
                document.getElementById('auto-save-setting').checked = this.settings.autoSave;
                document.getElementById('prevent-duplicates-setting').checked = this.settings.preventDuplicates;
                
                const gridSizeSlider = document.getElementById('grid-size-slider');
                gridSizeSlider.value = this.settings.gridSize;
                gridSizeSlider.nextElementSibling.textContent = `${this.settings.gridSize} x ${this.settings.gridSize}`;
                
                const maxWordsSlider = document.getElementById('max-words-slider');
                maxWordsSlider.value = this.settings.maxWords;
                maxWordsSlider.nextElementSibling.textContent = `${this.settings.maxWords} words`;
            }
            
            // Save settings to local storage
            saveSettings() {
                localStorage.setItem('crossword_settings', JSON.stringify(this.settings));
            }
            
            // Load settings from local storage
            loadSettings() {
                const savedSettings = localStorage.getItem('crossword_settings');
                if (savedSettings) {
                    this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
                }
            }
            
            // Save database to local storage
            saveDatabase() {
                localStorage.setItem('crossword_database', JSON.stringify(this.database));
            }
            
            // Load database from local storage
            loadDatabase() {
                const savedDatabase = localStorage.getItem('crossword_database');
                if (savedDatabase) {
                    this.database = JSON.parse(savedDatabase);
                }
            }
            
            // Show the loading overlay
            showLoading() {
                document.getElementById('loading-overlay').style.display = 'flex';
            }
            
            // Hide the loading overlay
            hideLoading() {
                document.getElementById('loading-overlay').style.display = 'none';
            }
            
            // Show a toast notification
            showToast(message, type = 'success') {
                const toast = document.getElementById('toast');
                const toastMessage = toast.querySelector('.toast-message');
                const toastIcon = toast.querySelector('.toast-icon');
                
                toast.className = 'toast';
                toast.classList.add(type);
                toastMessage.textContent = message;
                
                toastIcon.textContent = type === 'success' ? '✓' : '!';
                
                toast.classList.add('show');
                
                // Auto-hide after 3 seconds
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }
            
            // Helper function to get a random integer between min and max (inclusive)
            getRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        }
        
        // Crossword Generator Class
        class CrosswordGenerator {
            constructor(words, gridSize = 15, dense = false) {
                this.words = words.sort((a, b) => b.word.length - a.word.length); // Sort by length (longest first)
                this.gridSize = gridSize;
                this.dense = dense;
                this.maxAttempts = 10; // Maximum number of attempts to place all words
            }
            
            // Generate a crossword puzzle
            generate() {
                let bestPuzzle = null;
                let bestWordCount = 0;
                
                // Multiple attempts to find the best layout
                for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
                    const puzzle = new CrosswordPuzzle(this.gridSize);
                    let placedWords = 0;
                    
                    // Try to place each word
                    for (const { word, clue } of this.words) {
                        if (puzzle.addWord(word, clue)) {
                            placedWords++;
                        }
                    }
                    
                    // If we placed more words than before, update the best puzzle
                    if (placedWords > bestWordCount) {
                        bestPuzzle = puzzle;
                        bestWordCount = placedWords;
                        
                        // If we placed all words, we're done
                        if (placedWords === this.words.length) {
                            break;
                        }
                    }
                }
                
                // Return the best puzzle if we placed at least 3 words
                return bestWordCount >= 3 ? bestPuzzle : null;
            }
        }
        
        // Crossword Puzzle Class
        class CrosswordPuzzle {
            constructor(size) {
                // Initialize an empty grid
                this.grid = Array(size).fill().map(() => Array(size).fill(null));
                this.size = size;
                this.words = []; // List of placed words
                this.clues = { across: [], down: [] }; // Clues for across and down words
                this.nextNumber = 1; // Next number to assign to a word
            }
            
            // Add a word to the puzzle
            addWord(word, clue) {
                // First word is placed in the center
                if (this.words.length === 0) {
                    return this.placeFirstWord(word, clue);
                }
                
                // Try to place the word by intersecting with existing words
                const placements = this.findPlacements(word);
                
                // Sort placements by preference (more intersections is better)
                placements.sort((a, b) => b.intersections - a.intersections);
                
                // Try each placement
                for (const { x, y, direction } of placements) {
                    if (this.canPlaceWord(word, x, y, direction)) {
                        this.placeWord(word, clue, x, y, direction);
                        return true;
                    }
                }
                
                return false; // Could not place the word
            }
            
            // Place the first word in the center of the grid
            placeFirstWord(word, clue) {
                const center = Math.floor(this.size / 2);
                
                // Try to place horizontally first
                if (center + word.length / 2 < this.size) {
                    const x = Math.max(0, Math.floor(center - word.length / 2));
                    const y = center;
                    this.placeWord(word, clue, x, y, 'across');
                    return true;
                }
                
                // Otherwise place vertically
                const x = center;
                const y = Math.max(0, Math.floor(center - word.length / 2));
                this.placeWord(word, clue, x, y, 'down');
                return true;
            }
            
            // Find possible placements for a word
            findPlacements(word) {
                const placements = [];
                
                // Check each letter in the word against each cell in the grid
                for (let i = 0; i < word.length; i++) {
                    const letter = word[i];
                    
                    for (let y = 0; y < this.size; y++) {
                        for (let x = 0; x < this.size; x++) {
                            // If the cell has the same letter
                            if (this.grid[y][x] === letter) {
                                // Try placing across
                                const acrossX = x - i;
                                if (this.canPlaceWord(word, acrossX, y, 'across')) {
                                    const intersections = this.countIntersections(word, acrossX, y, 'across');
                                    placements.push({ x: acrossX, y, direction: 'across', intersections });
                                }
                                
                                // Try placing down
                                const downY = y - i;
                                if (this.canPlaceWord(word, x, downY, 'down')) {
                                    const intersections = this.countIntersections(word, x, downY, 'down');
                                    placements.push({ x, y: downY, direction: 'down', intersections });
                                }
                            }
                        }
                    }
                }
                
                return placements;
            }
            
            // Count intersections for a potential word placement
            countIntersections(word, x, y, direction) {
                let intersections = 0;
                
                for (let i = 0; i < word.length; i++) {
                    const cx = direction === 'across' ? x + i : x;
                    const cy = direction === 'down' ? y + i : y;
                    
                    // Cell must be empty or have the correct letter
                    if (this.grid[cy][cx] !== null && this.grid[cy][cx] !== word[i]) {
                        return false;
                    }
                    
                    // Check adjacent cells to ensure we're not placing a word too close to another
                    // (unless it's an intersection)
                    if (this.grid[cy][cx] !== word[i]) {
                        // Check if adjacent cells have letters
                        const adjacentCells = this.getAdjacentCells(cx, cy, direction);
                        if (adjacentCells.some(cell => cell !== null)) {
                            return false;
                        }
                    }
                }
                
                // Check cells before and after the word to make sure we're not extending an existing word
                if (direction === 'across') {
                    // Check before
                    if (x > 0 && this.grid[y][x - 1] !== null) {
                        return false;
                    }
                    
                    // Check after
                    if (x + word.length < this.size && this.grid[y][x + word.length] !== null) {
                        return false;
                    }
                } else {
                    // Check before
                    if (y > 0 && this.grid[y - 1][x] !== null) {
                        return false;
                    }
                    
                    // Check after
                    if (y + word.length < this.size && this.grid[y + word.length][x] !== null) {
                        return false;
                    }
                }
                
                return true;
            }
            
            // Check if a word can be placed at the given position
            canPlaceWord(word, x, y, direction) {
                // Check if the word fits on the grid
                if (x < 0 || y < 0) return false;
                
                if (direction === 'across' && x + word.length > this.size) return false;
                if (direction === 'down' && y + word.length > this.size) return false;
                
                // Check if the word can be placed
                for (let i = 0; i < word.length; i++) {
                    const cx = direction === 'across' ? x + i : x;
                    const cy = direction === 'down' ? y + i : y;
                    
                    // If the cell already has the same letter, it's an intersection
                    if (this.grid[cy][cx] === word[i]) {
                        continue;
                    }
                    
                    // If the cell is not empty, we can't place the word here
                    if (this.grid[cy][cx] !== null) {
                        return false;
                    }
                    
                    // Check adjacent cells to ensure we're not placing a word too close to another
                    // (unless it's an intersection)
                    const adjacentCells = this.getAdjacentCells(cx, cy, direction);
                    if (adjacentCells.some(cell => cell !== null)) {
                        return false;
                    }
                }
                
                // Check cells before and after the word to make sure we're not extending an existing word
                if (direction === 'across') {
                    // Check before
                    if (x > 0 && this.grid[y][x - 1] !== null) {
                        return false;
                    }
                    
                    // Check after
                    if (x + word.length < this.size && this.grid[y][x + word.length] !== null) {
                        return false;
                    }
                } else {
                    // Check before
                    if (y > 0 && this.grid[y - 1][x] !== null) {
                        return false;
                    }
                    
                    // Check after
                    if (y + word.length < this.size && this.grid[y + word.length][x] !== null) {
                        return false;
                    }
                }
                
                return true;
            }
            
            // Get adjacent cells (perpendicular to the direction)
            getAdjacentCells(x, y, direction) {
                const cells = [];
                
                if (direction === 'across') {
                    // Check above
                    if (y > 0) {
                        cells.push(this.grid[y - 1][x]);
                    }
                    
                    // Check below
                    if (y < this.size - 1) {
                        cells.push(this.grid[y + 1][x]);
                    }
                } else {
                    // Check left
                    if (x > 0) {
                        cells.push(this.grid[y][x - 1]);
                    }
                    
                    // Check right
                    if (x < this.size - 1) {
                        cells.push(this.grid[y][x + 1]);
                    }
                }
                
                return cells;
            }
            
            // Place a word on the grid
            placeWord(word, clue, x, y, direction) {
                // Add the word to the list
                const wordObj = {
                    word,
                    clue,
                    x,
                    y,
                    direction,
                    number: null
                };
                
                // Check if this position already has a number
                let number = this.getCellNumber(x, y);
                
                // If not, assign the next number
                if (number === null) {
                    number = this.nextNumber++;
                }
                
                wordObj.number = number;
                
                // Add to the list of words
                this.words.push(wordObj);
                
                // Add to the clues
                this.clues[direction].push({
                    number,
                    clue,
                    position: { x, y }
                });
                
                // Sort the clues by number
                this.clues[direction].sort((a, b) => a.number - b.number);
                
                // Place the letters on the grid
                for (let i = 0; i < word.length; i++) {
                    const cx = direction === 'across' ? x + i : x;
                    const cy = direction === 'down' ? y + i : y;
                    this.grid[cy][cx] = word[i];
                }
            }
            
            // Get the number of a cell (for clue numbering)
            getCellNumber(x, y) {
                // Check if any word starts at this position
                for (const word of this.words) {
                    if (word.x === x && word.y === y) {
                        return word.number;
                    }
                }
                
                return null;
            }
            
            // Get the clue at a specific position
            getClueAt(x, y, direction) {
                // Find a word that covers this position
                for (const clue of this.clues[direction]) {
                    const { x: startX, y: startY } = clue.position;
                    
                    if (direction === 'across') {
                        if (y === startY && x >= startX && x < startX + this.getWordLength(clue.number, direction)) {
                            return clue;
                        }
                    } else {
                        if (x === startX && y >= startY && y < startY + this.getWordLength(clue.number, direction)) {
                            return clue;
                        }
                    }
                }
                
                return null;
            }
            
            // Get the length of a word
            getWordLength(number, direction) {
                const word = this.words.find(w => w.number === number && w.direction === direction);
                return word ? word.word.length : 0;
            }
            
            // Get all cells in a word
            getWordCells(number, direction) {
                const cells = [];
                const word = this.words.find(w => w.number === number && w.direction === direction);
                
                if (!word) return cells;
                
                const { x, y, word: text } = word;
                
                for (let i = 0; i < text.length; i++) {
                    const cx = direction === 'across' ? x + i : x;
                    const cy = direction === 'down' ? y + i : y;
                    cells.push({ x: cx, y: cy });
                }
                
                return cells;
            }
            
            // Serialize the puzzle for saving
            serialize() {
                return {
                    size: this.size,
                    grid: this.grid,
                    words: this.words,
                    clues: this.clues,
                    nextNumber: this.nextNumber
                };
            }
            
            // Deserialize a puzzle
            static deserialize(data) {
                const puzzle = new CrosswordPuzzle(data.size);
                puzzle.grid = data.grid;
                puzzle.words = data.words;
                puzzle.clues = data.clues;
                puzzle.nextNumber = data.nextNumber;
                return puzzle;
            }
        }
        
        // Initialize the app when the DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            const app = new CrosswordApp();
            
            // Add some sample words to the database if it's empty
            if (app.database.length === 0) {
                const sampleWords = [
                    { word: 'JAVASCRIPT', clue: 'Programming language commonly used for web development' },
                    { word: 'HTML', clue: 'Markup language for creating web pages' },
                    { word: 'CSS', clue: 'Used for styling web pages' },
                    { word: 'ALGORITHM', clue: 'Step-by-step procedure for calculations' },
                    { word: 'DATABASE', clue: 'Organized collection of data' },
                    { word: 'VARIABLE', clue: 'Container for storing data values' },
                    { word: 'FUNCTION', clue: 'Block of code designed to perform a particular task' },
                    { word: 'LOOP', clue: 'Control structure that repeats a statement' },
                    { word: 'ARRAY', clue: 'Collection of elements identified by index' },
                    { word: 'OBJECT', clue: 'Collection of properties' },
                    { word: 'METHOD', clue: 'Function that is a property of an object' },
                    { word: 'CLASS', clue: 'Blueprint for creating objects' },
                    { word: 'INHERITANCE', clue: 'Mechanism for code reuse in OOP' },
                    { word: 'INTERFACE', clue: 'Point where two systems meet and interact' },
                    { word: 'API', clue: 'Set of rules that allow programs to talk to each other' }
                ];
                
                sampleWords.forEach(({ word, clue }) => {
                    app.addToDatabase(word, clue);
                });
                
                app.showToast('Sample words added to the database!', 'success');
            }
        });