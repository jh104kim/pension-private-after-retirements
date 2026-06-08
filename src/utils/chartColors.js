/**
 * 차트 색상 시스템 — 변경 금지
 * tailwind.config.js chart 색상과 동기화
 * 출처: CLAUDE.md, 01-domain-def.md
 */
export const CHART_COLORS = {
  national:  '#3B82F6',  // 국민연금  — blue-500
  db:        '#10B981',  // DB퇴직연금 — emerald-500
  irp:       '#8B5CF6',  // IRP       — violet-500
  savings:   '#F59E0B',  // 연금저축  — amber-500
  nontax:    '#94A3B8',  // 세제비적격 — slate-400
  rental:    '#06B6D4',  // 임대소득  — cyan-500
  deduct:    '#F87171',  // 세금/건보 — red-400
  labor:     '#84CC16',  // 근로소득  — lime-500
}

// 범례용 한글 라벨
export const CHART_LABELS = {
  national:  '국민연금',
  db:        'DB퇴직연금',
  irp:       'IRP',
  savings:   '연금저축',
  nontax:    '세제비적격',
  rental:    '임대소득',
  deduct:    '세금·건보료',
  labor:     '근로소득',
}
