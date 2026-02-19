#!/bin/bash

# 多智能体协作方案 - 优化配置部署脚本
# 使用方法: ./deploy.sh [trae_skills_path]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认路径
TRAEE_SKILLS_PATH="${1:-$HOME/.trae/skills}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  多智能体协作方案 - 优化配置部署工具  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查路径是否存在
if [ ! -d "$TRAEE_SKILLS_PATH" ]; then
    echo -e "${RED}错误: Trae技能目录不存在: $TRAEE_SKILLS_PATH${NC}"
    echo "请确认Trae IDE已安装，或手动指定技能目录路径"
    echo "用法: ./deploy.sh /path/to/.trae/skills"
    exit 1
fi

echo -e "${GREEN}✓${NC} 技能目录: $TRAEE_SKILLS_PATH"
echo ""

# 备份原有配置
echo -e "${YELLOW}步骤1: 备份原有配置...${NC}"
BACKUP_DIR="$TRAEE_SKILLS_PATH.backup.$(date +%Y%m%d_%H%M%S)"
cp -r "$TRAEE_SKILLS_PATH" "$BACKUP_DIR"
echo -e "${GREEN}✓${NC} 备份已创建: $BACKUP_DIR"
echo ""

# 更新技能文件
echo -e "${YELLOW}步骤2: 更新技能文件...${NC}"

# 更新 qa-standards-manager
if [ -d "$TRAEE_SKILLS_PATH/qa-standards-manager" ]; then
    cp "$SCRIPT_DIR/qa-standards-manager.md" "$TRAEE_SKILLS_PATH/qa-standards-manager/SKILL.md"
    echo -e "${GREEN}✓${NC} 已更新: qa-standards-manager"
else
    echo -e "${YELLOW}!${NC} 跳过: qa-standards-manager (目录不存在)"
fi

# 更新 project-flow-manager
if [ -d "$TRAEE_SKILLS_PATH/project-flow-manager" ]; then
    cp "$SCRIPT_DIR/project-flow-manager.md" "$TRAEE_SKILLS_PATH/project-flow-manager/SKILL.md"
    echo -e "${GREEN}✓${NC} 已更新: project-flow-manager"
else
    echo -e "${YELLOW}!${NC} 跳过: project-flow-manager (目录不存在)"
fi

# 更新 fullstack-game-engine
if [ -d "$TRAEE_SKILLS_PATH/fullstack-game-engine" ]; then
    cp "$SCRIPT_DIR/fullstack-game-engine.md" "$TRAEE_SKILLS_PATH/fullstack-game-engine/SKILL.md"
    echo -e "${GREEN}✓${NC} 已更新: fullstack-game-engine"
else
    echo -e "${YELLOW}!${NC} 跳过: fullstack-game-engine (目录不存在)"
fi

# 新增 bug-tracker
if [ ! -d "$TRAEE_SKILLS_PATH/bug-tracker" ]; then
    mkdir -p "$TRAEE_SKILLS_PATH/bug-tracker"
    echo -e "${GREEN}✓${NC} 已创建: bug-tracker 目录"
fi
cp "$SCRIPT_DIR/bug-tracker.md" "$TRAEE_SKILLS_PATH/bug-tracker/SKILL.md"
echo -e "${GREEN}✓${NC} 已添加: bug-tracker"

# 更新 experience-db
if [ -d "$TRAEE_SKILLS_PATH/project-experience-summarizer" ]; then
    cp "$SCRIPT_DIR/experience-db.md" "$TRAEE_SKILLS_PATH/project-experience-summarizer/experience-db.md"
    echo -e "${GREEN}✓${NC} 已更新: experience-db"
else
    echo -e "${YELLOW}!${NC} 跳过: experience-db (目录不存在)"
fi

echo ""

# 更新 fullstack-engine-init（添加bug-tracker检查）
echo -e "${YELLOW}步骤3: 更新初始化检查...${NC}"
if [ -d "$TRAEE_SKILLS_PATH/fullstack-engine-init" ]; then
    INIT_FILE="$TRAEE_SKILLS_PATH/fullstack-engine-init/SKILL.md"
    if [ -f "$INIT_FILE" ]; then
        # 检查是否已包含bug-tracker
        if ! grep -q "bug-tracker" "$INIT_FILE"; then
            # 在核心依赖部分添加bug-tracker
            sed -i '/### 核心依赖/a\
| 3 | bug-tracker | `.trae/skills/bug-tracker/` | Bug追踪管理，防止问题回退 |' "$INIT_FILE"
            echo -e "${GREEN}✓${NC} 已更新: fullstack-engine-init (添加bug-tracker检查)"
        else
            echo -e "${GREEN}✓${NC} 已包含: bug-tracker检查"
        fi
    fi
else
    echo -e "${YELLOW}!${NC} 跳过: fullstack-engine-init (目录不存在)"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}部署完成!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "优化内容:"
echo "  - 强制测试流程（功能/视觉/回归测试）"
echo "  - 阶段门控机制（检查通过才能进入下一阶段）"
echo "  - 审核检查清单（策划/程序审核逐项勾选）"
echo "  - Bug闭环管理（记录→修复→验证→关闭）"
echo "  - 经验库更新（新增4条经验记录）"
echo ""
echo "下一步:"
echo "  1. 重启Trae IDE使配置生效"
echo "  2. 查看 README.md 了解使用方法"
echo "  3. 查看 优化对比说明.md 了解详细变更"
echo ""
echo "备份位置: $BACKUP_DIR"
echo ""
