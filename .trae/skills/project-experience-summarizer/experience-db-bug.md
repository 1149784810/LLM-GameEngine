
---

## 经验记录 #9 - JavaScript常量定义顺序问题（连点器Pro）

- **项目类型**: Web游戏（HTML5 + JavaScript）
- **需求内容**: 连点器Pro游戏，包含多个系统类（GoldSystem, ItemSystem, BuffSystem, UIManager）
- **问题类型**: 技术问题 / JavaScript执行顺序
- **问题描述**: 
  - 点击后UI数字不更新
  - 道具商店为空，没有显示任何物品
  - 游戏功能完全失效
- **根本原因**: 
  - **JavaScript执行顺序**: 常量定义在文件末尾，但类的方法在文件开头就引用了这些常量
  - **类定义与常量定义顺序错误**: 当类的方法被调用时，常量还未定义
  - **UIManager示例**: `UI_ELEMENT_IDS` 定义在文件第545行，但 `_cacheElements()` 在第32行就使用了它
  - **ItemSystem示例**: `ITEM_CONFIG` 定义在文件第314行，但 `getItemInfo()` 在第35行就使用了它
- **解决方案**: 
  - **常量前置原则**: 所有常量必须在类定义之前定义
  - **文件结构规范**: 
    ```javascript
    // 1. 常量定义（必须在最前面）
    const CONSTANTS = { ... };
    
    // 2. 类定义
    class MyClass {
      constructor() {
        // 使用常量
        this.value = CONSTANTS.KEY;
      }
    }
    
    // 3. 全局暴露（最后）
    window.MyClass = MyClass;
    window.CONSTANTS = CONSTANTS;
    ```
- **预防措施**: 
  - **代码审查Checklist**:
    - [ ] 常量是否定义在文件开头
    - [ ] 类方法引用的常量是否在类定义之前
    - [ ] 文件加载顺序是否正确
  - **开发规范**:
    - 每个JS文件必须以常量定义开始
    - 类定义必须在所有依赖常量之后
    - 全局暴露语句必须在文件末尾
  - **调试技巧**:
    - 打开浏览器控制台，检查是否有 `ReferenceError: XXX is not defined`
    - 在关键位置添加 `console.log(typeof CONSTANT_NAME)` 验证常量是否存在
- **相关文件**: 
  - projects/clicker-game-pro/src/ui/UIManager.js
  - projects/clicker-game-pro/src/systems/ItemSystem.js
  - projects/clicker-game-pro/src/systems/BuffSystem.js
  - projects/clicker-game-pro/src/systems/GoldSystem.js
- 记录时间: 2026-02-18
- **适用范围**: 所有使用传统脚本方式（非ES Module）的JavaScript项目
