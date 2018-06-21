Signing up or logging in with email only will allow you to see the profile button and acknowledge that you are authenticated, but won't allow you to order pizza.

Once you login with either an email/password or a google account, the profile button will show the basic profile of the authenticated user. 

If/when the email is verified you will see an order pizza button after you log in, which will in turn show a view that allows you to place an order.

When an order is placed the full profile is fetched and the Google people API is called to return a users total contacts (Google includes the user themselves as a contact, so I am substracting 1 from the value). The value is added to the users metadata and also displayed along with the order.

The users gender is shown in the profile if they first authenticated with Google, and if there email/password account is linked to a Google account it will show in the profile once an order is placed.

Once an order is placed you can see the total contacts count in the profile metadata, where foo is the number:

"user_metadata": {
    "total_contacts": "foo"

Total_contacts value is refreshed from the people API on each pizza order, so if contacts are added or removed the value will change.