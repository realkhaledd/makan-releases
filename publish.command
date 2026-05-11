#!/bin/bash
cd "$(dirname "$0")"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MAKAN Property OS — Publisher    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# ── GitHub Token ──────────────────────────────────────────────────────────────
GH_TOKEN="${GH_TOKEN:-$(read -sp 'GitHub Token: ' t; echo $t)}"

# ── Read current version ──────────────────────────────────────────────────────
CURRENT=$(node -p "require('./package.json').version")
echo -e "${YELLOW}النسخة الحالية: v${CURRENT}${NC}"

# ── Auto-increment patch version ──────────────────────────────────────────────
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"

echo -e "${GREEN}النسخة الجديدة: v${NEW_VERSION}${NC}"
echo ""
read -p "$(echo -e ${YELLOW}"هل تريد المتابعة؟ (اضغط Enter للمتابعة أو Ctrl+C للإلغاء)"${NC})" CONFIRM
echo ""

# ── Update version in package.json ───────────────────────────────────────────
sed -i '' "s/\"version\": \"${CURRENT}\"/\"version\": \"${NEW_VERSION}\"/" package.json
echo -e "${GREEN}✅ تم تحديث الإصدار إلى v${NEW_VERSION}${NC}"
echo ""

# ── Build ─────────────────────────────────────────────────────────────────────
echo -e "${BLUE}⚙️  جاري البناء...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ فشل البناء!${NC}"
  # Rollback version
  sed -i '' "s/\"version\": \"${NEW_VERSION}\"/\"version\": \"${CURRENT}\"/" package.json
  exit 1
fi
echo -e "${GREEN}✅ تم البناء بنجاح${NC}"
echo ""

# ── Build & Publish DMG ───────────────────────────────────────────────────────
echo -e "${BLUE}📦 جاري رفع التحديث على GitHub...${NC}"
GH_TOKEN=$GH_TOKEN npx electron-builder --mac --publish always
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ فشل النشر!${NC}"
  exit 1
fi
echo ""

# ── Publish release (remove draft) ───────────────────────────────────────────
echo -e "${BLUE}🚀 جاري نشر الـ Release...${NC}"

sleep 3  # Wait for GitHub to register the release

RELEASE_ID=$(curl -s \
  -H "Authorization: Bearer $GH_TOKEN" \
  https://api.github.com/repos/realkhaledd/makan-releases/releases \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for r in data:
    if r.get('draft') and r.get('tag_name') == 'v${NEW_VERSION}':
        print(r['id'])
        break
")

if [ -z "$RELEASE_ID" ]; then
  echo -e "${YELLOW}⚠️  لم يتم العثور على الـ Release — قد يحتاج نشر يدوي${NC}"
else
  RESULT=$(curl -s -X PATCH \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"draft\": false, \"tag_name\": \"v${NEW_VERSION}\", \"name\": \"MAKAN Property OS v${NEW_VERSION}\"}" \
    https://api.github.com/repos/realkhaledd/makan-releases/releases/$RELEASE_ID \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tag_name','error'))")

  if [ "$RESULT" == "v${NEW_VERSION}" ]; then
    echo -e "${GREEN}✅ Release v${NEW_VERSION} منشور على GitHub${NC}"
  else
    echo -e "${YELLOW}⚠️  تحقق من GitHub يدوياً${NC}"
  fi
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 تم نشر v${NEW_VERSION} بنجاح!          ║${NC}"
echo -e "${GREEN}║   البرنامج سيتحدث تلقائياً عند العملاء ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
read -p "اضغط Enter للإغلاق..." DONE
