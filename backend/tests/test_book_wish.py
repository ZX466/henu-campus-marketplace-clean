import unittest

from app.routes.wishes import parse_wish_text


class BookWishParserTests(unittest.TestCase):
    def test_complete_request(self):
        result = parse_wish_text(
            "我是2024级软件工程学生，想买数据库原理教材，预算50元，金明校区"
        )
        self.assertEqual(result.major, "软件工程")
        self.assertEqual(result.grade, "2024级")
        self.assertEqual(result.course, "数据库原理")
        self.assertEqual(result.budget_max, 50)
        self.assertEqual(result.campus, "金明校区")
        self.assertEqual(result.missing_fields, [])

    def test_missing_fields_are_explicit(self):
        result = parse_wish_text("大三计算机科学与技术学生想买操作系统教材")
        self.assertEqual(result.missing_fields, ["budget_max", "campus"])

    def test_does_not_invent_textbook_edition(self):
        result = parse_wish_text("求购高等数学课本，预算30元以内")
        self.assertEqual(result.course, "高等数学")
        self.assertEqual(result.budget_max, 30)
        self.assertIsNone(getattr(result, "edition", None))


if __name__ == "__main__":
    unittest.main()
