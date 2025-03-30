import uuid

from sqlalchemy.exc import SQLAlchemyError

from app.models import Entry, Journal, Day


class JournalRepository:
    def __init__(self, db_session):
        self.db_session = db_session

    def recalculate_day_totals(self, day):
        """
        Recalculates and updates the totals for a given day.

        Parameters:
        - day (Day): The day object whose totals need to be recalculated.

        Returns:
        - bool: True if the recalculation and update were successful, False otherwise.
        """
        # Reset totals
        day.total_proteins = 0
        day.total_carbohydrates = 0
        day.total_fats = 0
        day.total_calories = 0
        day.total_water_intake = 0

        # Recalculate totals
        for entry in day.entries:
            day.total_proteins += entry.proteins
            day.total_carbohydrates += entry.carbohydrates
            day.total_fats += entry.fats
            day.total_calories += entry.calories
            day.total_water_intake += entry.water_intake

        try:
            self.db_session.commit()
            return True
        except Exception as e:
            self.db_session.rollback()
            print(f"Unexpected error encountered: {str(e)}")
            return False

    def update_day(self, day: Day):
        try:
            self.db_session.add(day)
            self.db_session.commit()
            return True, day
        except SQLAlchemyError as e:
            self.db_session.rollback()
            return False, e

    def get_day(self, day_id: uuid.UUID):
        # Fetch and all entries associated with day_id.
        try:
            day = self.db_session.query(Day).filter_by(day_id=day_id).first()
            if day:
                return day
            else:
                raise ValueError("Day not found")  # Use a specific exception to indicate not found
        except SQLAlchemyError:
            self.db_session.rollback()
            raise

    def get_journal(self, owner_id: uuid.UUID):
        # Fetch and return all days/entries associated with owner_id.
        try:
            journal = self.db_session.query(Journal).filter_by(owner_id=owner_id).first()
            if journal:
                return journal
            else:
                raise ValueError("Day not found")  # Use a specific exception to indicate not found
        except SQLAlchemyError:
            self.db_session.rollback()
            raise

    def add_entry(self, entry: Entry):
        # Insert a new entry into the database
        try:
            self.db_session.add(entry)
            self.db_session.commit()
            return True, entry
        except SQLAlchemyError as e:
            self.db_session.rollback()
            return False, e

    def delete_entry(self, entry_id: uuid.UUID):
        try:
            entry = self.db_session.query(Entry).filter_by(id=entry_id).first()
            if entry:
                self.db_session.delete(entry)
                self.db_session.commit()
                return True, None
            else:
                return False, "Entry not found"
        except SQLAlchemyError as e:
            self.db_session.rollback()
            return False, e

    def update_entry(self, entry: Entry):
        # Update an entry with new values in the database
        try:
            self.db_session.add(entry)  # Should overwrite b/c same ID
            self.db_session.commit()
            return True, entry
        except SQLAlchemyError as e:
            self.db_session.rollback()
            return False, e
