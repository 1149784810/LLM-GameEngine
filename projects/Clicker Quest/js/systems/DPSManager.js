/**
 * Clicker Quest - DPS管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 计算和管理每秒金币产出(DPS)，实现自动点击器的购买、升级和产出逻辑
 */

class DPSManager {
    constructor(eventBus, gameData, goldManager = null) {
        this.eventBus = eventBus;
        this.gameData = gameData;
        this.goldManager = goldManager;
        
        // DPS状态
        this.currentDPS = 0;
        this.highestDPS = 0;
        
        // 自动点击器列表 - Map<autoClickerId, autoClickerData>
        this.autoClickers = new Map();
        
        // 全局倍率
        this.globalMultiplier = 1;
        
        // 自动产出定时器
        this.autoProduceInterval = null;
        
        // 自动产出间隔(毫秒)
        this.autoProduceIntervalMs = 1000;
        
        // 累计自动产出金币
        this.totalAutoProducedGold = 0;
        
        // 初始化
        this._init();
    }

    /**
     * 初始化DPS管理器
     * @private
     */
    _init() {
        // 加载自动点击器配置
        this._loadAutoClickerConfigs();
        
        // 从gameData恢复DPS数据
        if (this.gameData && this.gameData.items && this.gameData.items.autoClickers) {
            this._loadFromGameData(this.gameData.items.autoClickers);
        }
        
        // 启动自动产出
        this._startAutoProduce();
        
        // 绑定事件监听
        this._bindEvents();
    }

    /**
     * 加载自动点击器配置
     * @private
     */
    _loadAutoClickerConfigs() {
        // 从GameConfig加载自动点击器配置
        if (typeof GameConfig !== 'undefined' && GameConfig.autoClickers) {
            GameConfig.autoClickers.forEach(config => {
                this.autoClickers.set(config.id, {
                    id: config.id,
                    name: config.name,
                    type: config.type,
                    baseDPS: config.baseDPS,
                    basePrice: config.basePrice,
                    priceMultiplier: config.priceMultiplier,
                    maxLevel: config.maxLevel,
                    count: 0,           // 当前拥有数量
                    level: 1,           // 当前等级
                    efficiency: 1,      // 效率倍率
                    totalProduced: 0    // 累计产出
                });
            });
        } else {
            // 默认配置（如果GameConfig未加载）
            const defaultConfigs = [
                { id: 'auto_001', name: '实习生', type: 'Beginner', baseDPS: 0.1, basePrice: 15, priceMultiplier: 1.07, maxLevel: 100 },
                { id: 'auto_002', name: '员工', type: 'Apprentice', baseDPS: 1, basePrice: 100, priceMultiplier: 1.08, maxLevel: 100 },
                { id: 'auto_003', name: '主管', type: 'Skilled', baseDPS: 5, basePrice: 500, priceMultiplier: 1.09, maxLevel: 100 },
                { id: 'auto_004', name: '经理', type: 'Professional', baseDPS: 20, basePrice: 2000, priceMultiplier: 1.10, maxLevel: 100 },
                { id: 'auto_005', name: '总监', type: 'Director', baseDPS: 100, basePrice: 10000, priceMultiplier: 1.11, maxLevel: 100 },
                { id: 'auto_006', name: 'VP', type: 'VP', baseDPS: 500, basePrice: 50000, priceMultiplier: 1.12, maxLevel: 100 },
                { id: 'auto_007', name: 'CEO', type: 'CEO', baseDPS: 2000, basePrice: 200000, priceMultiplier: 1.13, maxLevel: 100 },
                { id: 'auto_008', name: '董事会', type: 'Board', baseDPS: 10000, basePrice: 1000000, priceMultiplier: 1.14, maxLevel: 100 },
                { id: 'auto_009', name: '集团', type: 'Group', baseDPS: 50000, basePrice: 5000000, priceMultiplier: 1.15, maxLevel: 100 },
                { id: 'auto_010', name: '帝国', type: 'Empire', baseDPS: 250000, basePrice: 25000000, priceMultiplier: 1.15, maxLevel: 100 }
            ];
            
            defaultConfigs.forEach(config => {
                this.autoClickers.set(config.id, {
                    id: config.id,
                    name: config.name,
                    type: config.type,
                    baseDPS: config.baseDPS,
                    basePrice: config.basePrice,
                    priceMultiplier: config.priceMultiplier,
                    maxLevel: config.maxLevel,
                    count: 0,
                    level: 1,
                    efficiency: 1,
                    totalProduced: 0
                });
            });
        }
    }

    /**
     * 从gameData加载自动点击器数据
     * @private
     * @param {Array} autoClickersData - 自动点击器数据数组
     */
    _loadFromGameData(autoClickersData) {
        if (!Array.isArray(autoClickersData)) return;
        
        autoClickersData.forEach(data => {
            if (data && data.id && this.autoClickers.has(data.id)) {
                const clicker = this.autoClickers.get(data.id);
                clicker.count = data.count || 0;
                clicker.level = data.level || 1;
                clicker.efficiency = data.efficiency || 1;
                clicker.totalProduced = data.totalProduced || 0;
            }
        });
        
        // 重新计算DPS
        this.updateDPS();
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEvents() {
        if (this.eventBus && typeof this.eventBus.on === 'function') {
            // 监听BUFF激活事件
            this.eventBus.on('buff:activated', this._onBuffActivated.bind(this));
            
            // 监听BUFF停用事件
            this.eventBus.on('buff:deactivated', this._onBuffDeactivated.bind(this));
        }
    }

    /**
     * BUFF激活处理
     * @private
     * @param {Object} buff - BUFF数据
     */
    _onBuffActivated(buff) {
        if (buff && buff.effectType === 'DPS_BOOST') {
            // DPS提升类BUFF
            this.globalMultiplier *= buff.effectValue;
            this.updateDPS();
        }
    }

    /**
     * BUFF停用处理
     * @private
     * @param {Object} buff - BUFF数据
     */
    _onBuffDeactivated(buff) {
        if (buff && buff.effectType === 'DPS_BOOST') {
            // 移除DPS提升
            this.globalMultiplier /= buff.effectValue;
            this.updateDPS();
        }
    }

    /**
     * 启动自动产出
     * @private
     */
    _startAutoProduce() {
        if (this.autoProduceInterval) {
            clearInterval(this.autoProduceInterval);
        }
        
        this.autoProduceInterval = setInterval(() => {
            this._autoProduce();
        }, this.autoProduceIntervalMs);
    }

    /**
     * 停止自动产出
     * @private
     */
    _stopAutoProduce() {
        if (this.autoProduceInterval) {
            clearInterval(this.autoProduceInterval);
            this.autoProduceInterval = null;
        }
    }

    /**
     * 自动产出逻辑
     * @private
     */
    _autoProduce() {
        if (this.currentDPS <= 0) return;
        
        // 计算本次产出金币
        const goldProduced = this.currentDPS;
        
        // 累计产出
        this.totalAutoProducedGold += goldProduced;
        
        // 更新每个自动点击器的累计产出
        this.autoClickers.forEach(clicker => {
            if (clicker.count > 0) {
                const clickerDPS = this._calculateClickerDPS(clicker);
                clicker.totalProduced += clickerDPS;
            }
        });
        
        // 增加金币
        if (this.goldManager && typeof this.goldManager.addGold === 'function') {
            this.goldManager.addGold(goldProduced, 'auto_clicker');
        } else if (this.eventBus && typeof this.eventBus.emit === 'function') {
            // 通过事件通知增加金币
            this.eventBus.emit(GameEvents.GOLD_EARNED, {
                amount: goldProduced,
                source: 'auto_clicker'
            });
        }
    }

    /**
     * 添加自动点击器（购买）
     * @param {string} autoClickerId - 自动点击器ID
     * @param {number} quantity - 购买数量，默认1
     * @returns {Object} 购买结果
     */
    addAutoClicker(autoClickerId, quantity = 1) {
        const clicker = this.autoClickers.get(autoClickerId);
        
        if (!clicker) {
            return {
                success: false,
                error: 'AUTO_CLICKER_NOT_FOUND',
                message: '未找到该自动点击器'
            };
        }
        
        // 计算购买价格
        const totalPrice = this.calculateBuyPrice(autoClickerId, quantity);
        
        // 检查金币是否足够
        if (this.goldManager && !this.goldManager.hasEnoughGold(totalPrice)) {
            return {
                success: false,
                error: 'INSUFFICIENT_GOLD',
                message: '金币不足',
                required: totalPrice,
                current: this.goldManager.getCurrentGold()
            };
        }
        
        // 扣除金币
        if (this.goldManager && typeof this.goldManager.spendGold === 'function') {
            const spent = this.goldManager.spendGold(totalPrice, 'buy_auto_clicker');
            if (!spent) {
                return {
                    success: false,
                    error: 'SPEND_GOLD_FAILED',
                    message: '金币扣除失败'
                };
            }
        }
        
        // 增加数量
        clicker.count += quantity;
        
        // 更新DPS
        this.updateDPS();
        
        // 触发事件
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
            this.eventBus.emit(GameEvents.ITEM_PURCHASED, {
                itemId: autoClickerId,
                itemType: 'AUTO',
                quantity: quantity,
                price: totalPrice,
                newCount: clicker.count
            });
        }
        
        return {
            success: true,
            autoClickerId: autoClickerId,
            quantity: quantity,
            price: totalPrice,
            newCount: clicker.count,
            newDPS: this.currentDPS
        };
    }

    /**
     * 移除自动点击器
     * @param {string} autoClickerId - 自动点击器ID
     * @param {number} quantity - 移除数量，默认1
     * @returns {Object} 移除结果
     */
    removeAutoClicker(autoClickerId, quantity = 1) {
        const clicker = this.autoClickers.get(autoClickerId);
        
        if (!clicker) {
            return {
                success: false,
                error: 'AUTO_CLICKER_NOT_FOUND',
                message: '未找到该自动点击器'
            };
        }
        
        if (clicker.count < quantity) {
            return {
                success: false,
                error: 'INSUFFICIENT_COUNT',
                message: '数量不足',
                current: clicker.count,
                required: quantity
            };
        }
        
        // 减少数量
        clicker.count -= quantity;
        
        // 更新DPS
        this.updateDPS();
        
        return {
            success: true,
            autoClickerId: autoClickerId,
            quantity: quantity,
            newCount: clicker.count,
            newDPS: this.currentDPS
        };
    }

    /**
     * 升级自动点击器
     * @param {string} autoClickerId - 自动点击器ID
     * @returns {Object} 升级结果
     */
    upgradeAutoClicker(autoClickerId) {
        const clicker = this.autoClickers.get(autoClickerId);
        
        if (!clicker) {
            return {
                success: false,
                error: 'AUTO_CLICKER_NOT_FOUND',
                message: '未找到该自动点击器'
            };
        }
        
        // 检查是否达到最大等级
        if (clicker.level >= clicker.maxLevel) {
            return {
                success: false,
                error: 'MAX_LEVEL_REACHED',
                message: '已达到最高等级',
                currentLevel: clicker.level,
                maxLevel: clicker.maxLevel
            };
        }
        
        // 计算升级价格
        const upgradePrice = this.calculateUpgradePrice(autoClickerId);
        
        // 检查金币是否足够
        if (this.goldManager && !this.goldManager.hasEnoughGold(upgradePrice)) {
            return {
                success: false,
                error: 'INSUFFICIENT_GOLD',
                message: '金币不足',
                required: upgradePrice,
                current: this.goldManager.getCurrentGold()
            };
        }
        
        // 扣除金币
        if (this.goldManager && typeof this.goldManager.spendGold === 'function') {
            const spent = this.goldManager.spendGold(upgradePrice, 'upgrade_auto_clicker');
            if (!spent) {
                return {
                    success: false,
                    error: 'SPEND_GOLD_FAILED',
                    message: '金币扣除失败'
                };
            }
        }
        
        // 提升等级
        clicker.level += 1;
        
        // 提升效率（每级提升10%）
        clicker.efficiency = 1 + (clicker.level - 1) * 0.1;
        
        // 更新DPS
        this.updateDPS();
        
        // 触发事件
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
            this.eventBus.emit('autoClicker:upgraded', {
                autoClickerId: autoClickerId,
                newLevel: clicker.level,
                newEfficiency: clicker.efficiency,
                price: upgradePrice
            });
        }
        
        return {
            success: true,
            autoClickerId: autoClickerId,
            newLevel: clicker.level,
            newEfficiency: clicker.efficiency,
            price: upgradePrice,
            newDPS: this.currentDPS
        };
    }

    /**
     * 计算单个自动点击器的DPS
     * @private
     * @param {Object} clicker - 自动点击器对象
     * @returns {number} 该自动点击器的DPS
     */
    _calculateClickerDPS(clicker) {
        if (!clicker || clicker.count <= 0) return 0;
        
        // DPS = baseDPS × count × levelBonus
        // levelBonus = efficiency (每级提升10%)
        const levelBonus = clicker.efficiency;
        return clicker.baseDPS * clicker.count * levelBonus;
    }

    /**
     * 计算总DPS
     * @returns {number} 总DPS
     */
    calculateTotalDPS() {
        let totalDPS = 0;
        
        // 累加所有自动点击器的DPS
        this.autoClickers.forEach(clicker => {
            totalDPS += this._calculateClickerDPS(clicker);
        });
        
        // 应用全局倍率
        // 公式: DPS = Σ(baseDPS × count × levelBonus) × globalMultiplier
        totalDPS *= this.globalMultiplier;
        
        return totalDPS;
    }

    /**
     * 更新DPS
     */
    updateDPS() {
        const oldDPS = this.currentDPS;
        
        // 重新计算总DPS
        this.currentDPS = this.calculateTotalDPS();
        
        // 更新最高DPS记录
        if (this.currentDPS > this.highestDPS) {
            this.highestDPS = this.currentDPS;
        }
        
        // 触发DPS变化事件
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
            this.eventBus.emit(GameEvents.DPS_CHANGED, {
                oldDPS: oldDPS,
                newDPS: this.currentDPS,
                highestDPS: this.highestDPS,
                globalMultiplier: this.globalMultiplier
            });
        }
    }

    /**
     * 获取当前DPS
     * @returns {number} 当前DPS
     */
    getCurrentDPS() {
        return this.currentDPS;
    }

    /**
     * 获取最高DPS
     * @returns {number} 最高DPS
     */
    getHighestDPS() {
        return this.highestDPS;
    }

    /**
     * 设置全局倍率
     * @param {number} multiplier - 倍率值
     */
    setGlobalMultiplier(multiplier) {
        if (typeof multiplier !== 'number' || multiplier < 0) {
            console.warn('DPSManager: 无效的全局倍率值', multiplier);
            return;
        }
        
        this.globalMultiplier = multiplier;
        this.updateDPS();
    }

    /**
     * 应用临时倍率（用于BUFF等）
     * @param {number} multiplier - 临时倍率
     */
    applyTemporaryMultiplier(multiplier) {
        this.globalMultiplier *= multiplier;
        this.updateDPS();
    }

    /**
     * 移除临时倍率
     * @param {number} multiplier - 要移除的倍率
     */
    removeTemporaryMultiplier(multiplier) {
        this.globalMultiplier /= multiplier;
        this.updateDPS();
    }

    /**
     * 计算购买价格
     * @param {string} autoClickerId - 自动点击器ID
     * @param {number} quantity - 购买数量
     * @returns {number} 总价格
     */
    calculateBuyPrice(autoClickerId, quantity = 1) {
        const clicker = this.autoClickers.get(autoClickerId);
        if (!clicker) return 0;
        
        // 价格公式: price = basePrice × priceMultiplier^currentCount
        // 购买多个时，累加计算
        let totalPrice = 0;
        for (let i = 0; i < quantity; i++) {
            const price = clicker.basePrice * Math.pow(clicker.priceMultiplier, clicker.count + i);
            totalPrice += price;
        }
        
        return Math.floor(totalPrice);
    }

    /**
     * 计算升级价格
     * @param {string} autoClickerId - 自动点击器ID
     * @returns {number} 升级价格
     */
    calculateUpgradePrice(autoClickerId) {
        const clicker = this.autoClickers.get(autoClickerId);
        if (!clicker) return 0;
        
        // 升级价格 = 基础价格 × 等级系数
        // 等级系数 = 10 × 1.5^(level-1)
        const levelFactor = 10 * Math.pow(1.5, clicker.level - 1);
        return Math.floor(clicker.basePrice * levelFactor);
    }

    /**
     * 获取自动点击器信息
     * @param {string} autoClickerId - 自动点击器ID
     * @returns {Object|null} 自动点击器信息
     */
    getAutoClickerInfo(autoClickerId) {
        const clicker = this.autoClickers.get(autoClickerId);
        if (!clicker) return null;
        
        return {
            id: clicker.id,
            name: clicker.name,
            type: clicker.type,
            baseDPS: clicker.baseDPS,
            currentDPS: this._calculateClickerDPS(clicker),
            count: clicker.count,
            level: clicker.level,
            efficiency: clicker.efficiency,
            maxLevel: clicker.maxLevel,
            nextBuyPrice: this.calculateBuyPrice(autoClickerId, 1),
            upgradePrice: this.calculateUpgradePrice(autoClickerId),
            totalProduced: clicker.totalProduced
        };
    }

    /**
     * 获取所有自动点击器列表
     * @returns {Array} 自动点击器列表
     */
    getAllAutoClickers() {
        const list = [];
        this.autoClickers.forEach(clicker => {
            list.push(this.getAutoClickerInfo(clicker.id));
        });
        return list;
    }

    /**
     * 获取拥有的自动点击器列表
     * @returns {Array} 拥有的自动点击器列表
     */
    getOwnedAutoClickers() {
        const list = [];
        this.autoClickers.forEach(clicker => {
            if (clicker.count > 0) {
                list.push(this.getAutoClickerInfo(clicker.id));
            }
        });
        return list;
    }

    /**
     * 获取存档数据
     * @returns {Object} DPS数据
     */
    getSaveData() {
        const autoClickersData = [];
        this.autoClickers.forEach(clicker => {
            autoClickersData.push({
                id: clicker.id,
                count: clicker.count,
                level: clicker.level,
                efficiency: clicker.efficiency,
                totalProduced: clicker.totalProduced
            });
        });
        
        return {
            currentDPS: this.currentDPS,
            highestDPS: this.highestDPS,
            globalMultiplier: this.globalMultiplier,
            totalAutoProducedGold: this.totalAutoProducedGold,
            autoClickers: autoClickersData
        };
    }

    /**
     * 从存档数据恢复
     * @param {Object} data - 存档数据
     */
    loadSaveData(data) {
        if (!data) return;
        
        // 恢复DPS数据
        if (typeof data.currentDPS === 'number') {
            this.currentDPS = data.currentDPS;
        }
        
        if (typeof data.highestDPS === 'number') {
            this.highestDPS = data.highestDPS;
        }
        
        if (typeof data.globalMultiplier === 'number') {
            this.globalMultiplier = data.globalMultiplier;
        }
        
        if (typeof data.totalAutoProducedGold === 'number') {
            this.totalAutoProducedGold = data.totalAutoProducedGold;
        }
        
        // 恢复自动点击器数据
        if (Array.isArray(data.autoClickers)) {
            data.autoClickers.forEach(clickerData => {
                if (clickerData && clickerData.id && this.autoClickers.has(clickerData.id)) {
                    const clicker = this.autoClickers.get(clickerData.id);
                    clicker.count = clickerData.count || 0;
                    clicker.level = clickerData.level || 1;
                    clicker.efficiency = clickerData.efficiency || 1;
                    clicker.totalProduced = clickerData.totalProduced || 0;
                }
            });
        }
        
        // 重新计算DPS
        this.updateDPS();
    }

    /**
     * 重置DPS管理器
     */
    reset() {
        // 停止自动产出
        this._stopAutoProduce();
        
        // 重置状态
        this.currentDPS = 0;
        this.highestDPS = 0;
        this.globalMultiplier = 1;
        this.totalAutoProducedGold = 0;
        
        // 重置所有自动点击器
        this.autoClickers.forEach(clicker => {
            clicker.count = 0;
            clicker.level = 1;
            clicker.efficiency = 1;
            clicker.totalProduced = 0;
        });
        
        // 重新启动自动产出
        this._startAutoProduce();
    }

    /**
     * 销毁DPS管理器
     */
    destroy() {
        // 停止自动产出
        this._stopAutoProduce();
        
        // 清空数据
        this.autoClickers.clear();
        this.goldManager = null;
        this.eventBus = null;
    }

    /**
     * 设置GoldManager引用
     * @param {GoldManager} goldManager - 金币管理器
     */
    setGoldManager(goldManager) {
        this.goldManager = goldManager;
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        let totalCount = 0;
        let totalLevel = 0;
        
        this.autoClickers.forEach(clicker => {
            totalCount += clicker.count;
            totalLevel += clicker.level * clicker.count;
        });
        
        return {
            currentDPS: this.currentDPS,
            highestDPS: this.highestDPS,
            globalMultiplier: this.globalMultiplier,
            totalAutoClickers: totalCount,
            averageLevel: totalCount > 0 ? totalLevel / totalCount : 0,
            totalAutoProducedGold: this.totalAutoProducedGold,
            autoClickerTypes: this.autoClickers.size
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DPSManager;
} else {
    window.DPSManager = DPSManager;
}
