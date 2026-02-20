/**
 * Game - 游戏主入口
 * 负责初始化所有系统、协调各模块工作
 * 
 * @module Game
 * @author LP
 * @version 1.1.0
 */

class Game {
    constructor() {
        // 游戏配置
        this.config = null;
        
        // 核心系统
        this.gameState = null;
        this.clickSystem = null;
        this.comboSystem = null;
        this.criticalSystem = null;
        
        // 管理系统
        this.gpsManager = null;
        this.shopManager = null;
        this.itemManager = null;
        this.buffManager = null;
        this.achievementManager = null;
        this.leaderboardManager = null;
        this.offlineManager = null;
        this.saveManager = null;
        
        // UI系统
        this.uiManager = null;
        this.animationManager = null;
        this.toastManager = null;
        
        // 游戏状态
        this.isInitialized = false;
        this.isPaused = false;
        
        // 自动初始化
        this.init();
    }

    /**
     * 初始化游戏
     */
    async init() {
        try {
            console.log('[Game] 开始初始化游戏...');
            
            // 加载配置
            await this.loadConfig();
            
            // 初始化核心系统
            this.initCoreSystems();
            
            // 初始化管理系统
            this.initManagers();
            
            // 连接系统依赖
            this.connectSystems();
            
            // 初始化UI系统
            this.initUISystems();
            
            // 尝试加载存档
            this.loadSave();
            
            // 绑定事件
            this.bindEvents();
            
            // 启动游戏循环
            this.startGameLoop();
            
            this.isInitialized = true;
            console.log('[Game] 游戏初始化完成');
            
        } catch (error) {
            console.error('[Game] 游戏初始化失败:', error);
        }
    }

    /**
     * 加载游戏配置
     */
    async loadConfig() {
        try {
            const response = await fetch('./config/game.config.json');
            this.config = await response.json();
            console.log('[Game] 配置加载完成');
        } catch (error) {
            console.warn('[Game] 配置加载失败，使用默认配置');
            this.config = this.getDefaultConfig();
        }
    }

    /**
     * 获取默认配置
     * @returns {Object} 默认配置
     */
    getDefaultConfig() {
        return {
            gameParams: {
                click: {
                    baseOutput: 1,
                    comboWindow: 500,
                    comboMaxMultiplier: 2.0,
                    comboIncrement: 0.1
                },
                critical: {
                    small: { probability: 10, multiplier: 2 },
                    medium: { probability: 5, multiplier: 5 },
                    mega: { probability: 1, multiplier: 10 }
                },
                gps: {
                    produceInterval: 1000,
                    minGPS: 0
                },
                offline: {
                    efficiency: 0.5,
                    maxHours: 24,
                    minSeconds: 60
                },
                save: {
                    autoSaveInterval: 30000,
                    storageKey: 'clicker_quest_save'
                }
            },
            upgrades: {},
            items: {},
            achievements: {}
        };
    }

    /**
     * 初始化核心系统
     */
    initCoreSystems() {
        // 游戏状态管理
        this.gameState = new GameState();
        this.gameState.init(this.config);
        
        // 连击系统
        this.comboSystem = new ComboSystem(this.gameState);
        this.comboSystem.init(this.config.gameParams.click);
        
        // 暴击系统 (先创建，后续设置buffManager)
        this.criticalSystem = new CriticalSystem(this.gameState);
        this.criticalSystem.init(this.config.gameParams.critical);
        
        // 点击系统 (先创建，后续设置buffManager)
        this.clickSystem = new ClickSystem(
            this.gameState,
            this.comboSystem,
            this.criticalSystem
        );
        this.clickSystem.init(this.config.gameParams.click);
        
        console.log('[Game] 核心系统初始化完成');
    }
    
    /**
     * 连接系统依赖
     */
    connectSystems() {
        // 设置BuffManager引用到点击系统和暴击系统
        if (this.buffManager) {
            this.clickSystem.setBuffManager(this.buffManager);
            this.criticalSystem.setBuffManager(this.buffManager);
            // 确保GPSManager有BuffManager引用（虽然构造函数已传入，但这里再次确认）
            this.gpsManager.setBuffManager(this.buffManager);
        }
        
        // 设置连击系统事件监听
        this.comboSystem.on('comboBreak', (data) => {
            this.uiManager.updateComboDisplay(1.0, true);
        });
        
        // 设置暴击系统事件监听
        this.criticalSystem.on('megaCritical', (data) => {
            console.log('[Game] 大暴击!', data);
        });
        
        console.log('[Game] 系统依赖连接完成');
    }

    /**
     * 初始化管理系统
     */
    initManagers() {
        // Buff管理器（必须先初始化，其他系统依赖）
        this.buffManager = new BuffManager(this.gameState);
        this.buffManager.init();
        
        // GPS管理器
        this.gpsManager = new GPSManager(this.gameState, this.buffManager);
        this.gpsManager.init(this.config.gameParams.gps);
        
        // 商店管理器
        this.shopManager = new ShopManager(this.gameState);
        this.shopManager.init(this.config.upgrades);
        
        // 道具管理器
        this.itemManager = new ItemManager(this.gameState, this.buffManager);
        this.itemManager.init(this.config.items);
        
        // 成就管理器
        this.achievementManager = new AchievementManager(this.gameState);
        this.achievementManager.init(this.config.achievements);
        
        // 排行榜管理器
        this.leaderboardManager = new LeaderboardManager(this.gameState);
        this.leaderboardManager.init();
        
        // 离线管理器
        this.offlineManager = new OfflineManager(this.gameState, this.gpsManager);
        this.offlineManager.init(this.config.gameParams.offline);
        
        // 存档管理器
        this.saveManager = new SaveManager(this.gameState);
        this.saveManager.init(this.config.gameParams.save);
        
        console.log('[Game] 管理系统初始化完成');
    }

    /**
     * 初始化UI系统
     */
    initUISystems() {
        this.uiManager = new UIManager(this.gameState);
        this.uiManager.init();
        
        // 设置管理器引用
        this.uiManager.setManagers({
            shopManager: this.shopManager,
            itemManager: this.itemManager,
            buffManager: this.buffManager,
            toastManager: this.toastManager,
            achievementManager: this.achievementManager
        });
        
        this.animationManager = new AnimationManager();
        this.animationManager.init();
        
        this.toastManager = new ToastManager();
        this.toastManager.init();
        
        // 更新toastManager引用
        this.uiManager.toastManager = this.toastManager;
        
        console.log('[Game] UI系统初始化完成');
    }

    /**
     * 加载存档
     */
    loadSave() {
        const saveData = this.saveManager.loadGame();
        
        if (saveData) {
            this.gameState.loadPlayerData(saveData);
            
            // 计算离线收益
            const offlineResult = this.offlineManager.calculateOfflineReward();
            if (offlineResult.hasReward) {
                this.showOfflineReward(offlineResult);
            }
        } else {
            // 新游戏
            this.gameState.playerData.firstPlayTime = Date.now();
        }
        
        // 更新GPS
        this.gpsManager.calculateGPS();
    }

    /**
     * 显示离线收益
     * @param {Object} result - 离线收益结果
     */
    showOfflineReward(result) {
        // 更新弹窗内容
        const offlineTimeEl = document.getElementById('offline-time');
        const offlineGoldEl = document.getElementById('offline-gold');
        const offlineModal = document.getElementById('offline-modal');
        const claimBtn = document.getElementById('claim-offline-btn');
        
        if (offlineTimeEl) {
            offlineTimeEl.textContent = this.offlineManager.formatOfflineTime(result.offlineSeconds);
        }
        if (offlineGoldEl) {
            offlineGoldEl.textContent = this.offlineManager.formatNumber(result.reward);
        }
        
        // 显示弹窗
        if (offlineModal) {
            offlineModal.classList.remove('hidden');
        }
        
        // 绑定领取按钮
        if (claimBtn) {
            claimBtn.onclick = () => {
                const claimResult = this.offlineManager.claimOfflineReward();
                if (claimResult.success) {
                    this.uiManager.updateGoldDisplay(this.gameState.getGold());
                    if (offlineModal) {
                        offlineModal.classList.add('hidden');
                    }
                    if (this.toastManager) {
                        this.toastManager.show(`领取离线收益: ${this.offlineManager.formatNumber(claimResult.reward)} 金币`, 'success');
                    }
                    
                    // 检查离线成就
                    this.achievementManager.checkAchievementsByCategory('offline');
                }
            };
        }
        
        console.log('[Game] 离线收益:', result);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 点击按钮事件
        const clickBtn = document.getElementById('main-click-btn');
        if (clickBtn) {
            clickBtn.addEventListener('click', (e) => this.handleClick(e));
            
            // 支持触摸设备
            clickBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleClick(e);
            }, { passive: false });
        }
        
        // 监听金币变化
        this.gameState.on('goldChanged', (data) => {
            this.uiManager.updateGoldDisplay(this.gameState.getGold());
            this.animationManager.playGoldBumpAnimation(
                document.getElementById('gold-display')
            );
        });
        
        // 监听升级变化
        this.gameState.on('upgradeChanged', (data) => {
            this.gpsManager.updateGPS();
        });
        
        // 页面关闭前保存
        window.addEventListener('beforeunload', () => {
            this.saveManager.saveGame();
        });
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        console.log('[Game] 事件绑定完成');
    }

    /**
     * 处理点击事件
     * @param {Event} e - 事件对象
     */
    handleClick(e) {
        if (this.isPaused) return;
        
        const startTime = performance.now();
        
        // 处理点击
        const result = this.clickSystem.handleClick();
        
        // 播放动画
        const clickBtn = document.getElementById('main-click-btn');
        this.animationManager.playClickAnimation(clickBtn);
        
        // 创建飘字
        const container = document.getElementById('floating-text-container') || clickBtn.parentElement;
        if (container) {
            const rect = clickBtn.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            this.animationManager.createFloatingText(result.gold, container, {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2,
                criticalType: result.criticalType
            });
        }
        
        // 播放暴击特效
        if (result.criticalType !== 'NONE') {
            const gameContainer = document.getElementById('game-container');
            this.animationManager.playCriticalEffect(result.criticalType, gameContainer);
        }
        
        // 更新UI
        this.uiManager.updateComboDisplay(result.comboMultiplier);
        this.uiManager.updateCritRateDisplay(
            this.criticalSystem.getTotalCritRate()
        );
        
        // 检查点击类成就（而不是只检查click_1）
        this.achievementManager.checkAchievementsByCategory('click');
        
        // 性能监控
        const elapsed = performance.now() - startTime;
        if (elapsed > 50) {
            console.warn(`[Game] 点击处理耗时: ${elapsed.toFixed(2)}ms`);
        }
    }

    /**
     * 启动游戏循环
     */
    startGameLoop() {
        // 启动GPS产出
        this.gpsManager.startProduction();
        
        // 启动自动存档
        this.saveManager.startAutoSave();
        
        console.log('[Game] 游戏循环启动');
    }

    /**
     * 暂停游戏
     */
    pause() {
        this.isPaused = true;
        this.gpsManager.stopProduction();
        this.offlineManager.recordExitTime();
        this.saveManager.saveGame();
        console.log('[Game] 游戏暂停');
    }

    /**
     * 恢复游戏
     */
    resume() {
        this.isPaused = false;
        this.gpsManager.startProduction();
        console.log('[Game] 游戏恢复');
    }

    /**
     * 重置游戏
     */
    reset() {
        this.saveManager.deleteSave();
        this.gameState.reset();
        this.gpsManager.calculateGPS();
        this.uiManager.updateGoldDisplay(0);
        this.uiManager.updateGPSDisplay(0);
        console.log('[Game] 游戏重置');
    }
    
    /**
     * 获取游戏统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            gold: this.gameState.getGold(),
            totalClicks: this.clickSystem.getTotalClicks(),
            gps: this.gpsManager.getCurrentGPS(),
            combo: this.comboSystem.getComboState(),
            critRate: this.criticalSystem.getTotalCritRate(),
            critStats: this.criticalSystem.getCriticalStats()
        };
    }
}

// 游戏实例将在DOM加载完成后创建
window.Game = Game;
