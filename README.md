# iskofinder

Iskofinder is a scholarship finder web application designed to help users search, filter, and track scholarships. The project includes a user-friendly interface with features such as search, filtering by scholarship type and provider, sorting, and detailed scholarship information modals.

## Project Structure

- `html_files/`: Contains the HTML files for the web interface.
- `Scholarships_Data/`: Contains individual scholarship data files and an index.js that aggregates them.
- `admin/`: Contains admin-related scripts.
- `database/`: Contains database files.
- `scripts/`: Contains utility and API scripts.
- `style.css`: Main stylesheet for the project.
- `server.js` and `new_server.js`: Server-side scripts.

## Features

- Search scholarships by keywords.
- Filter scholarships by type and provider.
- Sort scholarships by title, amount, or deadline.
- Track scholarships and view tracked list.
- User authentication and admin panel (partially implemented).
- Responsive design and modals for detailed scholarship information.

## How to Run

1. Clone the repository.
2. Install necessary dependencies (if any).
3. Run the server using `node server.js` or `node new_server.js`.
4. Open the main page in a browser (e.g., `html_files/scholarship.html`).

## Notes

- The scholarship data is imported from individual JavaScript files aggregated in `Scholarships_Data/index.js`.
- Some features like user authentication and admin management require backend support.

## License

Specify your license here.
