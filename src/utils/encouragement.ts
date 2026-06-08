export interface Encouragement {
  title: string
  subtitle: string
}

export const encouragement = (accuracy: number): Encouragement => {
  if (accuracy >= 90)
    return { title: 'Чудова робота!', subtitle: 'Ти сьогодні чудово попрацював(ла)!' }
  if (accuracy >= 70)
    return { title: 'Гарний результат!', subtitle: 'Ще трохи практики — і буде ідеально.' }
  if (accuracy >= 50) return { title: 'Непогано!', subtitle: 'Повтори складні кани й спробуй ще раз.' }
  return { title: 'Тренуймося далі!', subtitle: 'Кожна спроба наближає тебе до мети.' }
}
