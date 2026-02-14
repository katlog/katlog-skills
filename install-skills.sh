#!/bin/bash

# Claude Code Skills 一键安装脚本
# 自动安装常用的 Skills 到 ~/.claude/skills 目录

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Skills 目录
SKILLS_DIR="$HOME/.claude/skills"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查并创建 Skills 目录
check_skills_dir() {
    if [ ! -d "$SKILLS_DIR" ]; then
        print_info "创建 Skills 目录: $SKILLS_DIR"
        mkdir -p "$SKILLS_DIR"
    else
        print_info "Skills 目录已存在: $SKILLS_DIR"
    fi
}

# 安装单个 Skill
install_skill() {
    local skill_name=$1
    local repo_url=$2
    local target_dir=$3

    if [ -z "$target_dir" ]; then
        target_dir=$skill_name
    fi

    local skill_path="$SKILLS_DIR/$target_dir"

    if [ -d "$skill_path" ]; then
        print_warning "Skill '$skill_name' 已安装，跳过"
        return 2  # 返回 2 表示已存在
    fi

    print_info "正在安装 $skill_name..."

    if git clone "$repo_url" "$skill_path" 2>/dev/null; then
        print_success "✓ $skill_name 安装成功"
        return 0  # 返回 0 表示成功
    else
        print_error "✗ $skill_name 安装失败"
        return 1  # 返回 1 表示失败
    fi
}

# 主函数
main() {
    echo ""
    echo "======================================"
    echo "  Claude Code Skills 一键安装工具"
    echo "======================================"
    echo ""

    # 检查 git 是否安装
    if ! command -v git &> /dev/null; then
        print_error "未找到 git 命令，请先安装 git"
        exit 1
    fi

    # 检查并创建目录
    check_skills_dir
    echo ""

    # 定义要安装的 Skills
    # 格式: skill_name|repo_url|target_dir
    declare -a skills=(
        "superpowers|https://github.com/obra/superpowers.git|superpowers"
        "planning-with-files|https://github.com/OthmanAdi/planning-with-files.git|planning-with-files"
        "vercel-labs-skills|https://github.com/vercel-labs/skills.git|vercel-labs-skills"
    )

    local success_count=0
    local skip_count=0
    local fail_count=0

    # 安装每个 Skill
    for skill_info in "${skills[@]}"; do
        IFS='|' read -r skill_name repo_url target_dir <<< "$skill_info"

        install_skill "$skill_name" "$repo_url" "$target_dir"
        local result=$?

        if [ $result -eq 0 ]; then
            ((success_count++))
        elif [ $result -eq 2 ]; then
            ((skip_count++))
        else
            ((fail_count++))
        fi
    done

    # 输出统计信息
    echo ""
    echo "======================================"
    echo "  安装完成"
    echo "======================================"
    echo -e "${GREEN}成功安装: $success_count${NC}"
    echo -e "${YELLOW}已存在跳过: $skip_count${NC}"
    if [ $fail_count -gt 0 ]; then
        echo -e "${RED}安装失败: $fail_count${NC}"
    fi
    echo ""

    # 列出已安装的 Skills
    print_info "当前已安装的 Skills:"
    echo ""
    ls -1 "$SKILLS_DIR" | grep -v "^\.DS_Store$" | while read -r skill; do
        echo "  • $skill"
    done
    echo ""

    print_success "所有操作完成！"
    echo ""
    echo "提示: 重启 Claude Code 以加载新安装的 Skills"
    echo ""
}

# 运行主函数
main
