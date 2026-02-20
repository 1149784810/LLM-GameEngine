/**
 * NumberFormatter - 数字格式化工具
 * 负责大数字格式化、科学计数法显示
 * 
 * @module NumberFormatter
 * @author LP
 * @version 1.0.0
 */

const NumberFormatter = {
    // 格式化阈值
    thresholds: {
        K: 1000,
        M: 1000000,
        B: 1000000000,
        T: 1000000000000
    },
    
    // 单位名称
    units: ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'],
    
    /**
     * 格式化数字
     * @param {number} num - 数字
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的字符串
     */
    format(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        if (num === Infinity) return '∞';
        if (num < 0) return '-' + this.format(-num, decimals);
        if (num < 1000) return Math.floor(num).toString();
        
        // 找到合适的单位
        let unitIndex = 0;
        let value = num;
        
        while (value >= 1000 && unitIndex < this.units.length - 1) {
            value /= 1000;
            unitIndex++;
        }
        
        // 格式化数值
        const formatted = value.toFixed(decimals);
        const trimmed = parseFloat(formatted).toString();
        
        return trimmed + this.units[unitIndex];
    },
    
    /**
     * 格式化为完整数字（带逗号）
     * @param {number} num - 数字
     * @returns {string} 格式化后的字符串
     */
    formatFull(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return Math.floor(num).toLocaleString();
    },
    
    /**
     * 解析格式化字符串为数字
     * @param {string} str - 格式化字符串
     * @returns {number} 数字
     */
    parse(str) {
        if (!str || typeof str !== 'string') return 0;
        
        const cleanStr = str.trim().toUpperCase();
        const match = cleanStr.match(/^([\d.]+)\s*([KMBT]?)$/);
        
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2];
        
        const multiplier = this.thresholds[unit] || 1;
        
        return value * multiplier;
    },
    
    /**
     * 格式化时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(seconds) {
        if (seconds < 60) return `${Math.floor(seconds)}秒`;
        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}分${secs}秒`;
        }
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}小时${minutes}分钟`;
        }
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}天${hours}小时`;
    },
    
    /**
     * 格式化百分比
     * @param {number} value - 值
     * @param {number} total - 总数
     * @param {number} decimals - 小数位数
     * @returns {string} 百分比字符串
     */
    formatPercent(value, total, decimals = 1) {
        if (total === 0) return '0%';
        const percent = (value / total) * 100;
        return percent.toFixed(decimals) + '%';
    }
};

window.NumberFormatter = NumberFormatter;
