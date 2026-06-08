import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * shadcn/ui 전용 className 합성 헬퍼
 * clsx로 조건부 조합 후 tailwind-merge로 충돌 클래스 정리
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
