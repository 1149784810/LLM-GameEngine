
---

## 经验记录 #10 - 类未暴露到全局命名空间（连点器Pro）

- **项目类型**: Web游戏（HTML5 + JavaScript）
- **需求内容**: 连点器Pro游戏，使用传统脚本方式加载多个JS文件
- **问题类型**: 技术问题 / 全局命名空间暴露
- **问题描述**: 
  - 点击后UI数字不更新
  - 道具商店为空
  - 游戏功能完全失效
  - 浏览器控制台报错：`ReferenceError: XXX is not defined`
- **根本原因**: 
  - **类未暴露到全局命名空间**: JS文件定义了类，但没有执行 `window.ClassName = ClassName;`
  - **跨文件访问失败**: 其他文件无法访问未暴露的类和常量
  - **EventBus.js示例**: 定义了 `class EventBus` 和 `const EVENT_GOLD_CHANGED`，但没有暴露到 `window`
  - **StateManager.js示例**: 定义了 `class StateManager`，但没有暴露到 `window`
- **解决方案**: 
  - **每个JS文件末尾必须添加**: 
    ```javascript
    // 暴露到全局命名空间
    window.ClassName = ClassName;
    window.CONSTANT_NAME = CONSTANT_NAME;
    ```
  - **完整的文件结构**:
    ```javascript
    // 1. 常量定义（必须在最前面）
    const CONSTANTS = { ... };
    
    // 2. 类定义
    class MyClass {
      // ...
    }
    
    // 3. 全局暴露（必须在最后）
    window.MyClass = MyClass;
    window.CONSTANTS = CONSTANTS;
    ```
- **预防措施**: 
  - **代码审查Checklist**:
    - [ ] 每个JS文件末尾是否有 `window.XXX = XXX;`
    - [ ] 类是否已暴露到全局命名空间
    - [ ] 常量是否已暴露到全局命名空间
    - [ ] 其他文件是否能正常访问
  - **调试技巧**:
    - 打开浏览器控制台，输入 `window.ClassName` 检查是否存在
    - 输入 `Object.keys(window).filter(k => k.includes('System'))` 查看已暴露的系统
    - 检查控制台是否有 `ReferenceError: XXX is not defined` 错误
- **影响范围**: 
  - 所有使用传统脚本方式（非ES Module）的多文件JavaScript项目
  - 特别是需要跨文件访问类和常量的项目
- **相关文件**: 
  - projects/clicker-game-pro/src/core/EventBus.js
  - projects/clicker-game-pro/src/core/StateManager.js
  - projects/clicker-game-pro/src/systems/GoldSystem.js
  - projects/clicker-game-pro/src/systems/ItemSystem.js
  - projects/clicker-game-pro/src/systems/BuffSystem.js
  - projects/clicker-game-pro/src/ui/UIManager.js
- 记录时间: 2026-02-18
- **适用范围**: 所有使用传统脚本方式（非ES Module）的JavaScript项目
