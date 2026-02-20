/**
 * GPSManager - 自动产出管理系统
 * 负责每秒自动产出金币、GPS计算
 * 
 * @module GPSManager
 * @author LP -> CP-1
 * @version 1.0.0
 */

class GPSManager {
    constructor(gameState, buffManager = null) {
        this.gameState = gameState;
        this.buffManager = buffManager;
        
        // GPS配置
        this.config = {
            produceInterval: 1000,  // 产出间隔(ms)
            minGPS: 0
        };
        
        // GPS状态
        this.gpsState = {
            currentGPS: 0,
            isRunning: false,
            intervalId: null
        };
    }

    /**
     * 初始化GPS系统
     * @param {Object} config - 配置参数
     */
    init(config) {
        this.config = { ...this.config, ...config };
        this.calculateGPS();
        console.log('[GPSManager] 初始化完成');
    }
    
    /**
     * 设置BuffManager引用
     * @param {BuffManager} buffManager - Buff管理器
     */
    setBuffManager(buffManager) {
        this.buffManager = buffManager;
    }

    /**
     * 启动自动产出
     */
    startProduction() {
        if (this.gpsState.isRunning) return;
        
        this.gpsState.isRunning = true;
        this.gpsState.intervalId = setInterval(() => {
            this.produceGold();
        }, this.config.produceInterval);
    }

    /**
     * 停止自动产出
     */
    stopProduction() {
        if (this.gpsState.intervalId) {
            clearInterval(this.gpsState.intervalId);
            this.gpsState.intervalId = null;
        }
        this.gpsState.isRunning = false;
    }

    /**
     * 产出金币
     */
    produceGold() {
        if (this.gpsState.currentGPS <= 0) return;
        
        // TODO: CP-1 实现GPS产出逻辑，包括buff加成
        const gold = this.calculateGPSGold();
        this.gameState.addGold(gold, 'gps');
    }

    /**
     * 计算GPS金币产出
     * @returns {number} 金币数量
     */
    calculateGPSGold() {
        let gold = this.gpsState.currentGPS;
        
        // 应用黄金之手加成
        const goldenTouchLevel = this.gameState.getUpgradeLevel('golden_touch');
        gold *= (1 + goldenTouchLevel * 0.10);
        
        // 应用BUFF GPS倍率
        if (this.buffManager) {
            gold *= this.buffManager.getGPSMultiplier();
        }
        
        return Math.floor(gold);
    }

    /**
     * 计算当前GPS
     * @returns {number} GPS值
     */
    calculateGPS() {
        // baseGPS = autoClickerLevel × 1 + megaClickerLevel × 10
        const autoClickerLevel = this.gameState.getUpgradeLevel('auto_clicker');
        const megaClickerLevel = this.gameState.getUpgradeLevel('mega_clicker');
        
        let gps = autoClickerLevel * 1 + megaClickerLevel * 10;
        
        // 注意：黄金之手加成和BUFF倍率在calculateGPSGold()中统一应用
        // 这里只计算基础GPS值，避免重复加成
        
        this.gpsState.currentGPS = Math.max(gps, this.config.minGPS);
        this.gameState.playerData.currentGPS = this.gpsState.currentGPS;
        
        return this.gpsState.currentGPS;
    }

    /**
     * 获取当前GPS
     * @returns {number} GPS值
     */
    getCurrentGPS() {
        return this.gpsState.currentGPS;
    }

    /**
     * 更新GPS（升级后调用）
     */
    updateGPS() {
        this.calculateGPS();
    }
}

// 导出模块
window.GPSManager = GPSManager;
