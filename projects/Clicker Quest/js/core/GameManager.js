/**
 * Clicker Quest - 游戏管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 游戏核心管理器，负责初始化所有子系统、管理游戏生命周期、协调各模块交互
 */

class GameManager {
    constructor() {
        // 游戏状态
        this.isInitialized = false;
        this.isRunning = false;
        this.isPaused = false;
        
        // 游戏数据
        this.gameData = null;
        
        // 子系统引用
        this.eventBus = null;
        this.goldManager = null;
        this.clickManager = null;
        this.shopManager = null;
        this.itemManager = null;
        this.achievementManager = null;
        this.saveManager = null;
        this.uiManager = null;
        this.dpsManager = null;
        this.criticalHitSystem = null;
        this.offlineRewardSystem = null;
        this.animationManager = null;
        
        // 游戏循环相关
        this.lastUpdateTime = 0;
        this.deltaTime = 0;
        this.gameLoopId = null;
        
        // 性能监控
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdateTime = 0;
        
        // 自动存档计时器
        this.autoSaveTimer = null;
        this.autoSaveInterval = GameConfig.save.autoSaveInterval;
        
        // 统计更新计时器
        this.statsUpdateTimer = null;
    }

    /**
     * 初始化游戏
     * @returns {Promise<boolean>} 初始化是否成功
     */
    async init() {
        console.log('[GameManager] 开始初始化游戏...');
        
        try {
            // 1. 初始化事件总线
            this.eventBus = new EventBus();
            this.eventBus.setDebugMode(false);
            console.log('[GameManager] 事件总线初始化完成');
            
            // 2. 加载存档数据
            const saveResult = await this._loadGameData();
            if (saveResult.success) {
                this.gameData = saveResult.data;
                console.log('[GameManager] 存档加载成功');
            } else {
                this.gameData = this._createNewGameData();
                console.log('[GameManager] 创建新游戏数据');
            }
            
            // 3. 初始化核心系统
            this._initSystems();
            console.log('[GameManager] 核心系统初始化完成');
            
            // 4. 初始化UI系统
            this._initUISystems();
            console.log('[GameManager] UI系统初始化完成');
            
            // 5. 计算离线收益
            if (saveResult.success && saveResult.timestamp) {
                this._calculateOfflineReward(saveResult.timestamp);
            }
            
            // 6. 绑定事件监听
            this._bindEvents();
            console.log('[GameManager] 事件绑定完成');
            
            // 7. 启动游戏循环
            this.startGameLoop();
            console.log('[GameManager] 游戏循环启动');
            
            // 8. 启动自动存档
            this._startAutoSave();
            
            // 9. 标记初始化完成
            this.isInitialized = true;
            this.isRunning = true;
            
            // 10. 触发游戏初始化完成事件
            this.eventBus.emit(GameEvents.GAME_INITIALIZED, {
                gameData: this.gameData,
                isNewGame: !saveResult.success
            });
            
            // 11. 触发游戏开始事件
            this.eventBus.emit(GameEvents.GAME_STARTED);
            
            console.log('[GameManager] 游戏初始化完成！');
            
            return true;
            
        } catch (error) {
            console.error('[GameManager] 初始化失败:', error);
            return false;
        }
    }

    /**
     * 初始化所有子系统
     * @private
     */
    _initSystems() {
        // 初始化暴击系统
        this.criticalHitSystem = new CriticalHitSystem(this.eventBus, this.gameData);
        
        // 初始化金币管理器
        this.goldManager = new GoldManager(this.eventBus, this.gameData);
        
        // 初始化道具管理器
        this.itemManager = new ItemManager(this.eventBus, this.goldManager, this.gameData);
        
        // 初始化DPS管理器
        this.dpsManager = new DPSManager(this.eventBus, this.gameData, this.goldManager);
        
        // 初始化商店管理器
        this.shopManager = new ShopManager(this.eventBus, this.goldManager, this.itemManager, this.gameData);
        
        // 初始化成就管理器
        this.achievementManager = new AchievementManager(
            this.eventBus, 
            this.goldManager, 
            this.itemManager, 
            this.gameData
        );
        
        // 初始化离线收益系统
        this.offlineRewardSystem = new OfflineRewardSystem(
            this.eventBus, 
            this.goldManager, 
            this.dpsManager, 
            this.gameData
        );
        
        // 初始化存档管理器
        this.saveManager = new SaveManager(this.eventBus, this.gameData);
        
        // 初始化点击管理器
        this.clickManager = new ClickManager(
            this.eventBus, 
            this.goldManager, 
            this.criticalHitSystem, 
            this.gameData
        );
    }

    /**
     * 初始化UI系统
     * @private
     */
    _initUISystems() {
        // 初始化动画管理器
        this.animationManager = new AnimationManager(this.eventBus);
        window.animationManager = this.animationManager;
        
        // 初始化UI管理器
        this.uiManager = new UIManager(this.eventBus, this.gameData);
        
        // 初始化主界面UI
        this.uiManager.mainScreenUI = new MainScreenUI(
            this.eventBus, 
            this.uiManager, 
            this.gameData
        );
        
        // 初始化商店界面UI
        this.uiManager.shopScreenUI = new ShopScreenUI(
            this.eventBus, 
            this.uiManager, 
            this.shopManager, 
            this.gameData
        );
        
        // 初始化弹窗管理器
        this.uiManager.modalManager = new ModalManager(this.eventBus);
        
        // 初始化成就界面UI
        this.uiManager.achievementScreenUI = new AchievementScreenUI(
            this.eventBus, 
            this.uiManager, 
            this.achievementManager, 
            this.gameData
        );
        
        // 设置UI管理器的引用
        this.uiManager.goldManager = this.goldManager;
        this.uiManager.dpsManager = this.dpsManager;
        
        // 初始化显示
        this._initializeDisplay();
    }

    /**
     * 初始化显示
     * @private
     */
    _initializeDisplay() {
        // 更新金币显示
        this.eventBus.emit(GameEvents.GOLD_CHANGED, {
            oldGold: 0,
            newGold: this.goldManager.getCurrentGold(),
            change: this.goldManager.getCurrentGold(),
            source: 'init'
        });
        
        // 更新DPS显示
        this.eventBus.emit(GameEvents.DPS_CHANGED, {
            oldDPS: 0,
            newDPS: this.dpsManager.getCurrentDPS(),
            highestDPS: this.dpsManager.getHighestDPS()
        });
    }

    /**
     * 加载游戏数据
     * @private
     * @returns {Promise<Object>} 游戏数据
     */
    async _loadGameData() {
        // 创建临时存档管理器来加载数据
        const tempSaveManager = new SaveManager(this.eventBus, null);
        const result = await tempSaveManager.load();
        tempSaveManager.destroy();
        
        return result;
    }

    /**
     * 创建新游戏数据
     * @private
     * @returns {Object} 新游戏数据
     */
    _createNewGameData() {
        return {
            player: {
                playerId: this._generatePlayerId(),
                playerName: '冒险者',
                createTime: Date.now(),
                lastSaveTime: Date.now(),
                totalPlayTime: 0,
                loginDays: 1,
                lastLoginDate: new Date().toISOString().split('T')[0]
            },
            gold: {
                currentGold: 0,
                totalGoldEarned: 0,
                totalGoldSpent: 0,
                globalMultiplier: 1
            },
            click: {
                totalClicks: 0,
                totalCrits: 0,
                clickPowerBonus: 0,
                clickMultiplier: 1,
                baseGoldPerClick: GameConfig.click.baseGoldPerClick
            },
            critical: {
                smallCritBonus: 0,
                mediumCritBonus: 0,
                largeCritBonus: 0,
                totalSmallCrits: 0,
                totalMediumCrits: 0,
                totalLargeCrits: 0
            },
            items: {
                ownedItems: [],
                activeBuffs: [],
                autoClickers: [],
                globalMultipliers: {
                    gold: 1,
                    click: 1,
                    dps: 1
                }
            },
            achievements: {
                unlockedAchievements: [],
                achievementProgress: {},
                totalAchievementPoints: 0
            },
            shop: {
                freeRefreshCount: 3,
                lastRefreshTime: 0,
                purchaseRecords: []
            },
            dps: {
                currentDPS: 0,
                highestDPS: 0,
                globalMultiplier: 1,
                totalAutoProducedGold: 0,
                autoClickers: []
            },
            offline: {
                pendingReward: 0,
                offlineTime: 0,
                lastCalculationTime: 0
            },
            settings: {
                audio: {
                    musicEnabled: true,
                    musicVolume: 80,
                    sfxEnabled: true,
                    sfxVolume: 70
                },
                notification: {
                    notificationEnabled: true,
                    offlineRewardNotification: true,
                    achievementNotification: true
                },
                display: {
                    particleEffects: true,
                    numberFormat: 'short',
                    theme: 'dark'
                }
            },
            statistics: {
                totalClicks: 0,
                totalCrits: 0,
                maxCritGold: 0,
                totalItemsPurchased: 0,
                totalAutoClickersPurchased: 0,
                totalAchievementsUnlocked: 0,
                highestDPS: 0,
                highestGold: 0,
                longestOfflineTime: 0,
                totalOfflineRewards: 0
            }
        };
    }

    /**
     * 生成玩家ID
     * @private
     * @returns {string} 玩家ID
     */
    _generatePlayerId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `player_${timestamp}_${random}`;
    }

    /**
     * 计算离线收益
     * @private
     * @param {number} lastSaveTime - 上次保存时间
     */
    _calculateOfflineReward(lastSaveTime) {
        const result = this.offlineRewardSystem.calculateOfflineReward(lastSaveTime, Date.now());
        
        if (result.offlineReward > 0) {
            console.log(`[GameManager] 离线收益: ${result.offlineRewardFormatted}, 离线时长: ${result.offlineTimeFormatted}`);
            
            // 显示离线收益弹窗
            this._showOfflineRewardModal(result);
        }
    }

    /**
     * 显示离线收益弹窗
     * @private
     * @param {Object} result - 离线收益结果
     */
    _showOfflineRewardModal(result) {
        const content = `
            <div class="offline-reward-modal">
                <div class="offline-icon">🌙</div>
                <h3>欢迎回来！</h3>
                <p class="offline-time">离线时长: ${result.offlineTimeFormatted}</p>
                <div class="offline-reward-amount">
                    <span class="gold-icon">💰</span>
                    <span class="reward-value">${result.offlineRewardFormatted}</span>
                </div>
                <p class="offline-note">基于您的DPS自动产出 (${result.ratio}效率)</p>
            </div>
        `;
        
        this.uiManager.modalManager.show({
            title: '离线收益',
            content: content,
            buttons: [
                {
                    text: '领取',
                    class: 'btn-primary',
                    action: 'claim'
                }
            ]
        }).then(action => {
            if (action === 'claim') {
                this.offlineRewardSystem.claimOfflineReward();
            }
        });
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEvents() {
        this.eventBus.on(GameEvents.GOLD_CHANGED, (data) => {
            if (this.gameData && this.gameData.gold) {
                this.gameData.gold.currentGold = this.goldManager.getCurrentGold();
                this.gameData.gold.totalGoldEarned = this.goldManager.getTotalGoldEarned();
                
                if (this.gameData.statistics && this.gameData.gold.currentGold > this.gameData.statistics.highestGold) {
                    this.gameData.statistics.highestGold = this.gameData.gold.currentGold;
                }
            }
        });
        
        this.eventBus.on(GameEvents.DPS_CHANGED, (data) => {
            if (this.gameData && this.gameData.dps) {
                this.gameData.dps.currentDPS = data.newDPS;
                this.gameData.dps.highestDPS = data.highestDPS;
                if (this.gameData.statistics) {
                    this.gameData.statistics.highestDPS = data.highestDPS;
                }
            }
        });
        
        this.eventBus.on(GameEvents.CLICK_PERFORMED, (data) => {
            if (this.gameData && this.gameData.statistics) {
                this.gameData.statistics.totalClicks++;
            }
        });
        
        this.eventBus.on(GameEvents.CRITICAL_HIT, (data) => {
            if (this.gameData && this.gameData.statistics) {
                this.gameData.statistics.totalCrits++;
                if (data.goldGained > this.gameData.statistics.maxCritGold) {
                    this.gameData.statistics.maxCritGold = data.goldGained;
                }
            }
        });
        
        this.eventBus.on(GameEvents.ITEM_PURCHASED, (data) => {
            if (this.gameData && this.gameData.statistics) {
                this.gameData.statistics.totalItemsPurchased++;
            }
        });
        
        this.eventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (data) => {
            if (this.gameData && this.gameData.statistics) {
                this.gameData.statistics.totalAchievementsUnlocked++;
            }
        });
        
        this.eventBus.on(GameEvents.SCREEN_CHANGED, (data) => {
            this.uiManager.switchScreen(data.screen);
        });
    }

    /**
     * 启动游戏循环
     */
    startGameLoop() {
        this.lastUpdateTime = performance.now();
        this.lastFpsUpdateTime = this.lastUpdateTime;
        this._gameLoop(this.lastUpdateTime);
    }

    /**
     * 游戏主循环
     * @param {number} currentTime - 当前时间戳
     * @private
     */
    _gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // 计算deltaTime
        this.deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        // 更新FPS
        this.frameCount++;
        if (currentTime - this.lastFpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdateTime = currentTime;
        }
        
        // 如果游戏没有暂停，更新各子系统
        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        // 继续循环
        this.gameLoopId = requestAnimationFrame((time) => this._gameLoop(time));
    }

    /**
     * 更新游戏状态
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    update(deltaTime) {
        // 更新游戏时间统计
        if (this.gameData) {
            this.gameData.player.totalPlayTime += deltaTime;
        }
        
        // 更新BUFF状态（通过ItemManager的定时器自动处理）
        // 更新成就进度
        if (this.achievementManager) {
            this._updateAchievementProgress();
        }
    }

    /**
     * 更新成就进度
     * @private
     */
    _updateAchievementProgress() {
        // 检查金币相关成就
        const currentGold = this.goldManager.getCurrentGold();
        const totalGoldEarned = this.goldManager.getTotalGoldEarned();
        
        // 检查点击相关成就
        const clickStats = this.clickManager.getClickStats();
        
        // 检查DPS相关成就
        const currentDPS = this.dpsManager.getCurrentDPS();
        
        // 更新成就进度（由AchievementManager内部处理）
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        this.eventBus.emit(GameEvents.GAME_PAUSED);
        
        // 保存游戏
        this.save(true);
        
        console.log('[GameManager] 游戏已暂停');
    }

    /**
     * 恢复游戏
     */
    resume() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.lastUpdateTime = performance.now();
        this.eventBus.emit(GameEvents.GAME_RESUMED);
        
        console.log('[GameManager] 游戏已恢复');
    }

    /**
     * 保存游戏
     * @param {boolean} isAutoSave - 是否自动存档
     * @returns {Promise<boolean>} 保存是否成功
     */
    async save(isAutoSave = false) {
        if (!this.saveManager) {
            console.warn('[GameManager] 存档管理器未初始化');
            return false;
        }
        
        // 更新最后保存时间
        if (this.gameData) {
            this.gameData.player.lastSaveTime = Date.now();
        }
        
        // 收集各模块数据
        this._collectModuleData();
        
        // 执行保存
        const result = await this.saveManager.save(isAutoSave);
        
        if (result.success) {
            console.log(`[GameManager] 游戏已保存 (${isAutoSave ? '自动' : '手动'})`);
        }
        
        return result.success;
    }

    /**
     * 收集各模块数据
     * @private
     */
    _collectModuleData() {
        if (!this.gameData) return;
        
        // 收集金币数据
        if (this.goldManager) {
            this.gameData.gold = this.goldManager.getSaveData();
        }
        
        // 收集点击数据
        if (this.clickManager) {
            this.gameData.click = this.clickManager.getSaveData();
        }
        
        // 收集暴击数据
        if (this.criticalHitSystem) {
            this.gameData.critical = this.criticalHitSystem.getSaveData();
        }
        
        // 收集道具数据
        if (this.itemManager) {
            this.gameData.items = this.itemManager.getSaveData();
        }
        
        // 收集DPS数据
        if (this.dpsManager) {
            this.gameData.dps = this.dpsManager.getSaveData();
        }
        
        // 收集商店数据
        if (this.shopManager) {
            this.gameData.shop = this.shopManager.getSaveData();
        }
        
        // 收集成就数据
        if (this.achievementManager) {
            this.gameData.achievements = this.achievementManager.getSaveData();
        }
        
        // 收集离线收益数据
        if (this.offlineRewardSystem) {
            this.gameData.offline = this.offlineRewardSystem.getSaveData();
        }
    }

    /**
     * 重置游戏
     * @param {boolean} confirm - 是否确认重置
     * @returns {Promise<boolean>} 重置是否成功
     */
    async reset(confirm = false) {
        if (!confirm) {
            // 显示确认弹窗
            const result = await this.uiManager.modalManager.confirm(
                '重置游戏',
                '确定要重置游戏吗？所有进度将被清除，此操作不可撤销！'
            );
            
            if (!result) return false;
        }
        
        // 停止游戏循环
        this.isRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // 停止自动存档
        this._stopAutoSave();
        
        // 重置所有模块
        if (this.goldManager) this.goldManager.reset();
        if (this.clickManager) this.clickManager.reset();
        if (this.criticalHitSystem) this.criticalHitSystem.reset();
        if (this.dpsManager) this.dpsManager.reset();
        if (this.shopManager) this.shopManager.loadSaveData({ freeRefreshCount: 3, lastRefreshTime: 0, purchaseRecords: [] });
        if (this.achievementManager) {
            this.achievementManager.unlockedAchievements.clear();
            this.achievementManager.achievementProgress.clear();
            this.achievementManager.totalAchievementPoints = 0;
        }
        if (this.offlineRewardSystem) this.offlineRewardSystem.reset();
        
        // 删除存档
        if (this.saveManager) {
            await this.saveManager.deleteSave();
        }
        
        // 创建新游戏数据
        this.gameData = this._createNewGameData();
        
        // 重新初始化显示
        this._initializeDisplay();
        
        // 重新启动游戏循环
        this.isRunning = true;
        this.isPaused = false;
        this.startGameLoop();
        this._startAutoSave();
        
        console.log('[GameManager] 游戏已重置');
        
        return true;
    }

    /**
     * 启动自动存档
     * @private
     */
    _startAutoSave() {
        if (this.autoSaveTimer) return;
        
        this.autoSaveTimer = setInterval(() => {
            this.save(true);
        }, this.autoSaveInterval);
    }

    /**
     * 停止自动存档
     * @private
     */
    _stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * 销毁游戏实例
     */
    destroy() {
        // 停止游戏循环
        this.isRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // 停止自动存档
        this._stopAutoSave();
        
        // 保存游戏数据
        this.save(false);
        
        // 销毁各子系统
        if (this.clickManager) this.clickManager.destroy();
        if (this.dpsManager) this.dpsManager.destroy();
        if (this.itemManager) this.itemManager.destroy();
        if (this.saveManager) this.saveManager.destroy();
        if (this.offlineRewardSystem) this.offlineRewardSystem.destroy();
        
        // 清理事件总线
        if (this.eventBus) {
            this.eventBus.clearAll();
        }
        
        console.log('[GameManager] 游戏实例已销毁');
    }

    /**
     * 获取游戏状态快照
     * @returns {Object} 游戏状态快照
     */
    getSnapshot() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            fps: this.fps,
            gold: this.goldManager ? this.goldManager.getCurrentGold() : 0,
            dps: this.dpsManager ? this.dpsManager.getCurrentDPS() : 0,
            totalClicks: this.gameData ? this.gameData.statistics.totalClicks : 0,
            playTime: this.gameData ? this.gameData.player.totalPlayTime : 0
        };
    }

    /**
     * 获取游戏数据
     * @returns {Object} 游戏数据
     */
    getGameData() {
        return this.gameData;
    }

    /**
     * 获取指定模块
     * @param {string} moduleName - 模块名称
     * @returns {Object|null} 模块实例
     */
    getModule(moduleName) {
        const modules = {
            eventBus: this.eventBus,
            goldManager: this.goldManager,
            clickManager: this.clickManager,
            shopManager: this.shopManager,
            itemManager: this.itemManager,
            achievementManager: this.achievementManager,
            saveManager: this.saveManager,
            uiManager: this.uiManager,
            dpsManager: this.dpsManager,
            criticalHitSystem: this.criticalHitSystem,
            offlineRewardSystem: this.offlineRewardSystem,
            animationManager: this.animationManager
        };
        
        return modules[moduleName] || null;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
} else {
    window.GameManager = GameManager;
}
