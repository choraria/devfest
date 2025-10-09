# DevFest Finder

A simple, open-source directory and URL redirector for Google Developer Group (GDG) DevFest events using the `devfe.st` domain.

## Features

- Short, memorable URLs for DevFest events (e.g., `devfe.st/bangalore`)
- Directory listing of all DevFest events globally
- Search and filter functionality
- Dynamic updates without requiring redeployment
- Theme-aware interface with light and dark modes
- Interactive map with location markers
- Secure update mechanism via GitHub Issues and approval workflow

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes
- **Data Storage**: Static JSON file
- **Deployment**: Vercel
- **Automation**: GitHub Actions for updates
- **Mapping**: Leaflet with theme-aware tiles

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/choraria/devfest.git
   cd devfest
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with your site configuration:
   ```
   NEXT_PUBLIC_SITE_URL=https://devfe.st
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Data Structure

Each redirect entry contains:

### Required Fields:
- `destinationUrl`: The URL to redirect to (must be HTTPS)
- `devfestDate`: Date of the DevFest event (YYYY-MM-DD format)
- `devfestName`: Name of the DevFest event (auto-generated if not provided)
- `updatedBy`: GitHub username of last updater
- `updatedAt`: ISO timestamp of last update

Note: The `slug` is used as the identifier for the redirect and is required in the issue title but not stored in the entry data.

### Optional Fields:
- `gdgChapter`: GDG chapter name
- `city`: City name
- `countryName`: Country name
- `countryCode`: Country code (ISO)
- `latitude`: Geographic coordinates
- `longitude`: Geographic coordinates
- `gdgUrl`: GDG chapter URL

## Requesting URL Updates

To request a URL update:

1. Go to the [Issues page](https://github.com/choraria/devfest/issues/new?assignees=&labels=update-url&template=url_update.yml&title=Update+DevFest+details%3A+%5BCity%5D+%28slug%3A+city-name%29)
2. Fill out the required information in the issue template
3. Submit the issue
4. Wait for repository owner approval

Our GitHub Actions workflow will:
1. Validate the provided information
2. Request approval from repository owner
3. Update the URL after approval
4. Add a 'processed' label and close the issue
5. Provide confirmation with the updated details

Note: The workflow only updates existing entries. New entries must be added through the seeding process.

## Features in Detail

### Theme-Aware Map
- Automatically switches between light and dark modes
- Uses grayscale styling in dark mode for better visibility
- Maintains colored markers in both modes
- Smooth transitions between themes

### Directory Interface
- Searchable by DevFest name and location
- Filterable by country
- Sortable date column
- Quick copy functionality for short URLs
- Direct links to update existing entries

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Developer Groups (GDG) for organizing DevFest events worldwide
- The open-source community for the tools that make this project possible
