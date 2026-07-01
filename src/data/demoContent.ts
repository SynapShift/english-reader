import type { Book, Translation } from '../types/reader'
import { prideAndPrejudice } from './prideAndPrejudice'

export const demoBooks: Book[] = [
  prideAndPrejudice,
  {
    id: 'secret-garden',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    level: 'B1',
    summary: 'A quiet classic for building vocabulary around nature, feelings, and family.',
    color: 'teal',
    chapters: [
      {
        id: 'chapter-1',
        title: 'Chapter 1: There Is No One Left',
        content: [
          'When Mary Lennox was sent to Misselthwaite Manor to live with her uncle, everybody said she was the most disagreeable-looking child ever seen.',
          'Her face was little and thin, her hair was yellow, and her expression was sour because she had always been ill in one way or another.',
          'She heard the wind sweeping across the moor at night, and it sounded like a person crying far away in the darkness.',
        ],
      },
      {
        id: 'chapter-2',
        title: 'Chapter 2: Mistress Mary Quite Contrary',
        content: [
          'The house was large and strange, with many rooms that seemed to whisper when she walked past their closed doors.',
          'Mary began to wonder about the locked garden and the key that might open it.',
          'For the first time, curiosity warmed her more than anger.',
        ],
      },
    ],
  },
  {
    id: 'sherlock',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    level: 'B2',
    summary: 'Detective stories with sharp dialogue, observation, and useful everyday verbs.',
    color: 'amber',
    chapters: [
      {
        id: 'chapter-1',
        title: 'Chapter 1: A Scandal in Bohemia',
        content: [
          'To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name.',
          'In his eyes she eclipses and predominates the whole of her sex.',
          'It was not that he felt any emotion akin to love for Irene Adler.',
        ],
      },
    ],
  },
  {
    id: 'little-prince',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupery',
    level: 'A2',
    summary: 'Short poetic chapters, gentle sentences, and good material for daily reading.',
    color: 'indigo',
    chapters: [
      {
        id: 'chapter-1',
        title: 'Chapter 1: The Drawing',
        content: [
          'Once when I was six years old I saw a magnificent picture in a book about the primeval forest.',
          'It was a picture of a boa constrictor swallowing an animal.',
          'Grown-ups never understand anything by themselves, and it is tiresome for children to explain things to them again and again.',
        ],
      },
    ],
  },
]

export const demoDictionary: Record<string, Translation> = {
  disagreeable: {
    word: 'disagreeable',
    phonetic: '/dis-a-gree-uh-bul/',
    meaning: '令人不快的；难相处的',
    example: 'A disagreeable person is hard to please.',
    source: 'demo',
  },
  expression: {
    word: 'expression',
    phonetic: '/ik-spresh-un/',
    meaning: '表情；表达方式',
    example: 'Her expression changed when she heard the news.',
    source: 'demo',
  },
  sweeping: {
    word: 'sweeping',
    phonetic: '/swee-ping/',
    meaning: '横扫的；广泛的',
    example: 'A sweeping wind crossed the open field.',
    source: 'demo',
  },
  curiosity: {
    word: 'curiosity',
    phonetic: '/kyoo-ree-os-i-tee/',
    meaning: '好奇心',
    example: 'Curiosity made her open the old box.',
    source: 'demo',
  },
  eclipses: {
    word: 'eclipses',
    phonetic: '/i-klip-siz/',
    meaning: '使黯然失色；超过',
    example: 'Her skill eclipses everyone else in the room.',
    source: 'demo',
  },
  magnificent: {
    word: 'magnificent',
    phonetic: '/mag-nif-i-sunt/',
    meaning: '壮丽的；极好的',
    example: 'They saw a magnificent view from the hill.',
    source: 'demo',
  },
  tiresome: {
    word: 'tiresome',
    phonetic: '/tai-er-sum/',
    meaning: '令人厌烦的',
    example: 'Repeating the same task can feel tiresome.',
    source: 'demo',
  },
}
