/**
 * Clicker Quest - 数字格式化工具
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 格式化数字显示（金币、DPS等）
 */

class NumberFormatter {
    constructor() {
        // 格式化阈值
        this.thresholds = GameConfig ? GameConfig.gold.formatThresholds : {
            k: 1000,
            m: 1000000,
            b: 1000000000,
            t: 1000000000000
        };
        
        // 单位映射（从大到小排序）
        this.units = [
            { value: 1e12, symbol: 'T' },
            { value: 1e9, symbol: 'B' },
            { value: 1e6, symbol: 'M' },
            { value: 1e3, symbol: 'K' }
        ];
        
        // 科学计数法阈值（超过1T使用科学计数法）
        this.scientificThreshold = 1e15;
    }

    /**
     * 格式化数字
     * @param {number} num - 数字
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的字符串
     */
    format(num, decimals = 2) {
        // 处理无效输入
        if (num === null || num === undefined || isNaN(num)) {
            return '0';
        }
        
        // 处理负数
        if (num < 0) {
            return '-' + this.format(Math.abs(num), decimals);
        }
        
        // 处理零
        if (num === 0) {
            return '0';
        }
        
        // 超大数值使用科学计数法
        if (num >= this.scientificThreshold) {
            return this.toScientific(num, decimals);
        }
        
        // 小于1000直接返回
        if (num < 1000) {
            return Math.floor(num) === num ? num.toString() : num.toFixed(decimals);
        }
        
        // 查找合适的单位
        for (const unit of this.units) {
            if (num >= unit.value) {
                const value = num / unit.value;
                // 如果是整数，不显示小数位
                const formatted = value < 10 ? value.toFixed(2) : 
                                 value < 100 ? value.toFixed(1) : 
                                 Math.floor(value).toString();
                return formatted + unit.symbol;
            }
        }
        
        return num.toString();
    }

    /**
     * 格式化金币
     * @param {number} gold - 金币数量
     * @returns {string} 格式化后的字符串
     */
    formatGold(gold) {
        if (gold === null || gold === undefined || isNaN(gold)) {
            return '0';
        }
        return this.format(gold, 2);
    }

    /**
     * 格式化DPS
     * @param {number} dps - DPS值
     * @returns {string} 格式化后的字符串
     */
    formatDPS(dps) {
        if (dps === null || dps === undefined || isNaN(dps)) {
            return '+0';
        }
        return '+' + this.format(dps, 2);
    }

    /**
     * 格式化百分比
     * @param {number} value - 数值
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的字符串
     */
    formatPercent(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0%';
        }
        return value.toFixed(decimals) + '%';
    }

    /**
     * 解析格式化字符串为数字
     * @param {string} str - 格式化字符串
     * @returns {number} 数字
     */
    parse(str) {
        if (!str || typeof str !== 'string') {
            return 0;
        }
        
        // 移除空格和逗号
        str = str.trim().replace(/,/g, '');
        
        // 处理科学计数法
        if (str.includes('e') || str.includes('E')) {
            return parseFloat(str) || 0;
        }
        
        // 提取数字部分和单位
        const match = str.match(/^(-?\d+\.?\d*)\s*([KkMmBbTt])?$/);
        if (!match) {
            return parseFloat(str) || 0;
        }
        
        const num = parseFloat(match[1]);
        const unit = match[2] ? match[2].toUpperCase() : null;
        
        // 根据单位计算实际值
        const unitMultipliers = {
            'K': 1e3,
            'M': 1e6,
            'B': 1e9,
            'T': 1e12
        };
        
        if (unit && unitMultipliers[unit]) {
            return num * unitMultipliers[unit];
        }
        
        return num;
    }

    /**
     * 格式化为科学计数法
     * @param {number} num - 数字
     * @param {number} decimals - 小数位数
     * @returns {string} 科学计数法字符串
     */
    toScientific(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) {
            return '0';
        }
        
        if (num === 0) {
            return '0';
        }
        
        // 使用指数表示法
        const exp = num.toExponential(decimals);
        
        // 标准化格式：1.23e+15
        return exp;
    }

    /**
     * 格式化时间（秒转为可读格式）
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(seconds) {
        if (seconds === null || seconds === undefined || isNaN(seconds)) {
            return '0秒';
        }
        
        if (seconds < 60) {
            return Math.floor(seconds) + '秒';
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分钟`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return minutes > 0 ? `${hours}小时${minutes}分` : `${hours}小时`;
        } else {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
        }
    }

    /**
     * 格式化数字为带千分位的字符串
     * @param {number} num - 数字
     * @returns {string} 带千分位的字符串
     */
    formatWithCommas(num) {
        if (num === null || num === undefined || isNaN(num)) {
            return '0';
        }
        
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NumberFormatter;
} else {
    window.NumberFormatter = NumberFormatter;
}
