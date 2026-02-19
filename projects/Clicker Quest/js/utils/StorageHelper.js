/**
 * Clicker Quest - 存储辅助工具
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 封装localStorage操作，提供统一的存储接口
 */

class StorageHelper {
    constructor(prefix = 'clicker_quest_') {
        // 存储前缀，避免与其他应用冲突
        this.prefix = prefix;
        
        // 检查localStorage是否可用
        this.isAvailable = this._checkAvailability();
    }

    /**
     * 检查localStorage是否可用
     * @private
     * @returns {boolean} 是否可用
     */
    _checkAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('StorageHelper: localStorage不可用，存档功能将受限');
            return false;
        }
    }

    /**
     * 生成带前缀的完整键名
     * @private
     * @param {string} key - 原始键名
     * @returns {string} 完整键名
     */
    _getFullKey(key) {
        return this.prefix + key;
    }

    /**
     * 存储数据
     * @param {string} key - 键名
     * @param {*} value - 值（支持任意可JSON序列化的数据）
     * @returns {boolean} 是否成功
     */
    set(key, value) {
        if (!this.isAvailable) {
            console.warn('StorageHelper: 存储不可用');
            return false;
        }

        try {
            const fullKey = this._getFullKey(key);
            const serialized = JSON.stringify({
                value: value,
                timestamp: Date.now(),
                type: this._getType(value)
            });
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.error('StorageHelper: 存储空间已满');
            } else {
                console.error('StorageHelper: 存储失败', e);
            }
            return false;
        }
    }

    /**
     * 获取数据
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 数据值
     */
    get(key, defaultValue = null) {
        if (!this.isAvailable) {
            return defaultValue;
        }

        try {
            const fullKey = this._getFullKey(key);
            const serialized = localStorage.getItem(fullKey);
            
            if (serialized === null) {
                return defaultValue;
            }

            const parsed = JSON.parse(serialized);
            return parsed.value !== undefined ? parsed.value : defaultValue;
        } catch (e) {
            console.error('StorageHelper: 读取失败', e);
            return defaultValue;
        }
    }

    /**
     * 删除数据
     * @param {string} key - 键名
     * @returns {boolean} 是否成功
     */
    remove(key) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            const fullKey = this._getFullKey(key);
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            console.error('StorageHelper: 删除失败', e);
            return false;
        }
    }

    /**
     * 检查键是否存在
     * @param {string} key - 键名
     * @returns {boolean} 是否存在
     */
    has(key) {
        if (!this.isAvailable) {
            return false;
        }

        const fullKey = this._getFullKey(key);
        return localStorage.getItem(fullKey) !== null;
    }

    /**
     * 清空所有数据（仅清除带前缀的数据）
     */
    clear() {
        if (!this.isAvailable) {
            return;
        }

        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.error('StorageHelper: 清空失败', e);
        }
    }

    /**
     * 获取存储大小（字节）
     * @returns {number} 存储大小（字节）
     */
    getSize() {
        if (!this.isAvailable) {
            return 0;
        }

        let totalSize = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const value = localStorage.getItem(key);
                    // 每个字符占2字节（UTF-16）
                    totalSize += (key.length + (value ? value.length : 0)) * 2;
                }
            }
        } catch (e) {
            console.error('StorageHelper: 计算大小失败', e);
        }
        return totalSize;
    }

    /**
     * 获取所有键名
     * @returns {string[]} 键名数组（不含前缀）
     */
    keys() {
        if (!this.isAvailable) {
            return [];
        }

        const keys = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key.substring(this.prefix.length));
                }
            }
        } catch (e) {
            console.error('StorageHelper: 获取键名失败', e);
        }
        return keys;
    }

    /**
     * 检查存储空间是否充足
     * @param {number} requiredSize - 需要的空间（字节）
     * @returns {boolean} 是否充足
     */
    hasSpace(requiredSize) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            // 尝试写入测试数据
            const testKey = this._getFullKey('__space_test__');
            const testData = 'x'.repeat(requiredSize);
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 获取数据类型
     * @private
     * @param {*} value - 值
     * @returns {string} 类型名称
     */
    _getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * 获取数据的存储时间戳
     * @param {string} key - 键名
     * @returns {number|null} 时间戳或null
     */
    getTimestamp(key) {
        if (!this.isAvailable) {
            return null;
        }

        try {
            const fullKey = this._getFullKey(key);
            const serialized = localStorage.getItem(fullKey);
            
            if (serialized === null) {
                return null;
            }

            const parsed = JSON.parse(serialized);
            return parsed.timestamp || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * 获取存储使用情况
     * @returns {Object} 存储使用情况
     */
    getStorageInfo() {
        const usedSize = this.getSize();
        // localStorage通常限制5MB
        const maxQuota = 5 * 1024 * 1024;
        
        return {
            used: usedSize,
            usedFormatted: this._formatBytes(usedSize),
            quota: maxQuota,
            quotaFormatted: this._formatBytes(maxQuota),
            available: maxQuota - usedSize,
            availableFormatted: this._formatBytes(maxQuota - usedSize),
            percentUsed: ((usedSize / maxQuota) * 100).toFixed(2) + '%',
            isAvailable: this.isAvailable,
            keyCount: this.keys().length
        };
    }

    /**
     * 格式化字节数
     * @private
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的字符串
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 导出所有数据
     * @returns {Object} 所有数据
     */
    exportAll() {
        const data = {};
        const keys = this.keys();
        
        keys.forEach(key => {
            data[key] = this.get(key);
        });
        
        return data;
    }

    /**
     * 导入数据
     * @param {Object} data - 要导入的数据
     * @param {boolean} overwrite - 是否覆盖已存在的数据
     * @returns {Object} 导入结果
     */
    importAll(data, overwrite = true) {
        const result = {
            success: 0,
            failed: 0,
            skipped: 0
        };

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (!overwrite && this.has(key)) {
                    result.skipped++;
                    continue;
                }

                if (this.set(key, data[key])) {
                    result.success++;
                } else {
                    result.failed++;
                }
            }
        }

        return result;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageHelper;
} else {
    window.StorageHelper = StorageHelper;
}
