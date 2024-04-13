

class UserInfoService:
    """
    UserInfoService allows the user to view and edit their User data
    """
    def __init__(self, user_info_repository):
        self.user_info_repository = user_info_repository
