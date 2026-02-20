/**
 * Storage - 本地存储工具
 * 负责localStorage的封装和管理，提供数据版本管理、错误处理
 * 
 * @module Storage
 * @author LP -> CP-2
 * @version 1.1.0
 */

const Storage = {
    // 存储前缀
    prefix: 'cq_',
    
    // 存储版本（用于数据迁移）
    version: 1,
    
    // 最大存储大小（5MB）
    maxSize: 5 * 1024 * 1024,
    
    // 错误记录
    errors: [],
    maxErrors: 50,

    /**
     * 设置存储项
     * @param {string} key - 键名
     * @param {any} value - 值
     * @param {Object} options - 选项
     * @returns {Object} 操作结果
     */
    set(key, value, options = {}) {
        const startTime = performance.now();
        
        try {
            // 构建存储数据
            const storageData = {
                value: value,
                version: this.version,
                timestamp: Date.now(),
                expires: options.expires ? Date.now() + options.expires : null
            };
            
            const serialized = JSON.stringify(storageData);
            const fullKey = this.prefix + key;
            
            // 检查存储空间
            const availableSpace = this.getAvailableSpace();
            const dataSize = serialized.length * 2; // UTF-16编码
            
            if (dataSize > availableSpace) {
                // 尝试清理过期数据
                this.cleanExpired();
                
                // 再次检查
                const newAvailable = this.getAvailableSpace();
                if (dataSize > newAvailable) {
                    const error = `存储空间不足: 需要 ${this.formatSize(dataSize)}, 可用 ${this.formatSize(newAvailable)}`;
                    this.recordError(error);
                    return { success: false, reason: 'quota_exceeded', required: dataSize, available: newAvailable };
                }
            }
            
            // 保存数据
            localStorage.setItem(fullKey, serialized);
            
            const duration = performance.now() - startTime;
            
            return { 
                success: true, 
                size: dataSize,
                duration 
            };
            
        } catch (error) {
            const errorMsg = `Storage set error (${key}): ${error.message}`;
            console.error(errorMsg, error);
            this.recordError(errorMsg);
            
            // 处理配额超限错误
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                return { success: false, reason: 'quota_exceeded' };
            }
            
            return { success: false, reason: 'error', error: error.message };
        }
    },
    
    /**
     * 获取存储项
     * @param {string} key - 键名
     * @param {any} defaultValue - 默认值
     * @returns {any} 存储的值
     */
    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const serialized = localStorage.getItem(fullKey);
            
            if (serialized === null) {
                return defaultValue;
            }
            
            const storageData = JSON.parse(serialized);
            
            // 检查是否过期
            if (storageData.expires && Date.now() > storageData.expires) {
                this.remove(key);
                return defaultValue;
            }
            
            // 检查版本（如果需要迁移）
            if (storageData.version !== undefined && storageData.version < this.version) {
                // 可以在这里添加数据迁移逻辑
                console.log(`[Storage] 数据版本迁移: ${storageData.version} -> ${this.version}`);
            }
            
            return storageData.value;
            
        } catch (error) {
            console.error(`Storage get error (${key}):`, error);
            this.recordError(`Storage get error (${key}): ${error.message}`);
            return defaultValue;
        }
    },
    
    /**
     * 删除存储项
     * @param {string} key - 键名
     * @returns {boolean} 是否成功
     */
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error(`Storage remove error (${key}):`, error);
            this.recordError(`Storage remove error (${key}): ${error.message}`);
            return false;
        }
    },
    
    /**
     * 检查存储项是否存在
     * @param {string} key - 键名
     * @returns {boolean} 是否存在
     */
    has(key) {
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    },
    
    /**
     * 清除所有存储项（带前缀）
     * @param {boolean} includeAll - 是否清除所有（包括其他应用的数据）
     */
    clear(includeAll = false) {
        try {
            if (includeAll) {
                localStorage.clear();
            } else {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                });
            }
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            this.recordError(`Storage clear error: ${error.message}`);
            return false;
        }
    },
    
    /**
     * 清理过期数据
     */
    cleanExpired() {
        try {
            const now = Date.now();
            const keys = Object.keys(localStorage);
            let cleaned = 0;
            
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.expires && now > data.expires) {
                            localStorage.removeItem(key);
                            cleaned++;
                        }
                    } catch (e) {
                        // 解析失败的数据也删除
                        localStorage.removeItem(key);
                        cleaned++;
                    }
                }
            });
            
            if (cleaned > 0) {
                console.log(`[Storage] 清理了 ${cleaned} 个过期数据`);
            }
            
            return cleaned;
            
        } catch (error) {
            console.error('Storage cleanExpired error:', error);
            return 0;
        }
    },
    
    /**
     * 获取存储大小（字节）
     * @returns {number} 存储大小
     */
    getSize() {
        let size = 0;
        for (const key in localStorage) {
            if (key.startsWith(this.prefix)) {
                // UTF-16编码，每个字符2字节
                size += localStorage[key].length * 2;
            }
        }
        return size;
    },
    
    /**
     * 获取可用存储空间
     * @returns {number} 可用空间（字节）
     */
    getAvailableSpace() {
        return this.maxSize - this.getSize();
    },
    
    /**
     * 获取存储使用率
     * @returns {number} 使用率（0-1）
     */
    getUsageRatio() {
        return this.getSize() / this.maxSize;
    },
    
    /**
     * 获取所有键名
     * @returns {Array} 键名数组
     */
    keys() {
        const result = [];
        for (const key in localStorage) {
            if (key.startsWith(this.prefix)) {
                result.push(key.replace(this.prefix, ''));
            }
        }
        return result;
    },
    
    /**
     * 获取存储项数量
     * @returns {number} 数量
     */
    count() {
        return this.keys().length;
    },
    
    /**
     * 获取存储项信息
     * @param {string} key - 键名
     * @returns {Object|null} 存储项信息
     */
    getInfo(key) {
        try {
            const fullKey = this.prefix + key;
            const serialized = localStorage.getItem(fullKey);
            
            if (serialized === null) {
                return null;
            }
            
            const storageData = JSON.parse(serialized);
            const size = serialized.length * 2;
            
            return {
                key,
                size,
                formattedSize: this.formatSize(size),
                version: storageData.version,
                timestamp: storageData.timestamp,
                expires: storageData.expires,
                isExpired: storageData.expires ? Date.now() > storageData.expires : false,
                age: Date.now() - (storageData.timestamp || 0)
            };
            
        } catch (error) {
            return null;
        }
    },
    
    /**
     * 批量设置
     * @param {Object} items - 键值对对象
     * @returns {Object} 操作结果
     */
    setMultiple(items) {
        const results = {};
        let successCount = 0;
        let failCount = 0;
        
        for (const [key, value] of Object.entries(items)) {
            const result = this.set(key, value);
            results[key] = result;
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
        }
        
        return {
            success: failCount === 0,
            successCount,
            failCount,
            results
        };
    },
    
    /**
     * 批量获取
     * @param {Array} keys - 键名数组
     * @returns {Object} 键值对对象
     */
    getMultiple(keys) {
        const result = {};
        keys.forEach(key => {
            result[key] = this.get(key);
        });
        return result;
    },
    
    /**
     * 批量删除
     * @param {Array} keys - 键名数组
     * @returns {Object} 操作结果
     */
    removeMultiple(keys) {
        let successCount = 0;
        let failCount = 0;
        
        keys.forEach(key => {
            if (this.remove(key)) {
                successCount++;
            } else {
                failCount++;
            }
        });
        
        return {
            success: failCount === 0,
            successCount,
            failCount
        };
    },
    
    /**
     * 记录错误
     * @param {string} error - 错误信息
     */
    recordError(error) {
        this.errors.push({
            message: error,
            timestamp: Date.now()
        });
        
        // 限制错误记录数量
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
    },
    
    /**
     * 获取错误记录
     * @returns {Array} 错误记录数组
     */
    getErrors() {
        return [...this.errors];
    },
    
    /**
     * 清除错误记录
     */
    clearErrors() {
        this.errors = [];
    },
    
    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化的大小字符串
     */
    formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    },
    
    /**
     * 导出所有数据
     * @returns {Object} 导出结果
     */
    exportAll() {
        try {
            const data = {};
            const keys = this.keys();
            
            keys.forEach(key => {
                data[key] = this.get(key);
            });
            
            return {
                success: true,
                data,
                count: keys.length,
                size: this.getSize(),
                exportedAt: Date.now()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * 导入数据
     * @param {Object} data - 数据对象
     * @param {boolean} overwrite - 是否覆盖已存在的数据
     * @returns {Object} 导入结果
     */
    importAll(data, overwrite = false) {
        try {
            let imported = 0;
            let skipped = 0;
            
            for (const [key, value] of Object.entries(data)) {
                if (!overwrite && this.has(key)) {
                    skipped++;
                    continue;
                }
                
                const result = this.set(key, value);
                if (result.success) {
                    imported++;
                }
            }
            
            return {
                success: true,
                imported,
                skipped
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * 获取存储统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const keys = this.keys();
        const totalSize = this.getSize();
        
        return {
            itemCount: keys.length,
            totalSize,
            formattedSize: this.formatSize(totalSize),
            availableSpace: this.getAvailableSpace(),
            formattedAvailable: this.formatSize(this.getAvailableSpace()),
            usageRatio: this.getUsageRatio(),
            usagePercent: Math.round(this.getUsageRatio() * 100),
            errorCount: this.errors.length,
            version: this.version
        };
    },
    
    /**
     * 检查存储健康状态
     * @returns {Object} 健康状态
     */
    checkHealth() {
        const stats = this.getStats();
        const issues = [];
        
        // 检查存储空间
        if (stats.usageRatio > 0.9) {
            issues.push('storage_near_limit');
        }
        
        // 检查错误数量
        if (this.errors.length > 10) {
            issues.push('many_errors');
        }
        
        // 测试读写
        const testKey = '__health_check__';
        const testValue = { test: true, timestamp: Date.now() };
        const writeResult = this.set(testKey, testValue);
        const readValue = this.get(testKey);
        const deleteResult = this.remove(testKey);
        
        const canWrite = writeResult.success;
        const canRead = JSON.stringify(readValue) === JSON.stringify(testValue);
        const canDelete = deleteResult;
        
        if (!canWrite) issues.push('write_failed');
        if (!canRead) issues.push('read_failed');
        if (!canDelete) issues.push('delete_failed');
        
        return {
            healthy: issues.length === 0,
            issues,
            canWrite,
            canRead,
            canDelete,
            stats
        };
    }
};

// 导出模块
window.Storage = Storage;
