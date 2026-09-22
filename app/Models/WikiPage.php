<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class WikiPage extends Model
{
    use HasFactory;

    protected $table = 'wikipages';

    protected $fillable = [
        'title',
        'wiki_slug',
        'content',
        'elements',
        'html_content', // Added this
        'status',
        'user_id'
    ];

    protected $casts = [
        'content' => 'array',
        'elements' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected function content(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => json_decode($value, true),
            set: fn ($value) => json_encode($value)
        );
    }

    protected function elements(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => json_decode($value, true),
            set: fn ($value) => json_encode($value)
        );
    }

    // Alias for backward compatibility if needed
    public function getSlugAttribute()
    {
        return $this->wiki_slug;
    }

    // Helper method to generate HTML from elements
    public function generateHtml()
    {
        if (empty($this->elements)) {
            return '<!DOCTYPE html><html><body><p>Empty page</p></body></html>';
        }

        return $this->convertElementsToHtml($this->elements);
    }

    // Convert elements to HTML (same logic as in Editor.jsx)
    private function convertElementsToHtml($elements)
    {
        // This should match the logic in Editor.jsx convertElementsToHtml function
        // You might want to extract this to a shared service class
        $htmlContent = '';
        foreach ($elements as $element) {
            $styleString = '';
            if (isset($element['styles'])) {
                foreach ($element['styles'] as $key => $value) {
                    $cssKey = preg_replace('/([A-Z])/', '-$1', $key);
                    $cssKey = strtolower($cssKey);
                    $styleString .= $cssKey . ': ' . $value . '; ';
                }
            }

            switch ($element['type']) {
                case 'HEADER':
                    $htmlContent .= '<h2 style="' . $styleString . '">' . htmlspecialchars($element['content']) . '</h2>';
                    break;
                case 'PARAGRAPH':
                    $htmlContent .= '<p style="' . $styleString . '">' . nl2br(htmlspecialchars($element['content'])) . '</p>';
                    break;
                case 'BUTTON':
                    if (isset($element['href']) && $element['href']) {
                        $htmlContent .= '<a href="' . htmlspecialchars($element['href']) . '" style="' . $styleString . '">' . htmlspecialchars($element['content']) . '</a>';
                    } else {
                        $htmlContent .= '<button style="' . $styleString . '">' . htmlspecialchars($element['content']) . '</button>';
                    }
                    break;
                case 'IMAGE':
                    $src = $element['src'] ?? 'https://picsum.photos/400/300';
                    $alt = $element['alt'] ?? '';
                    $htmlContent .= '<img src="' . htmlspecialchars($src) . '" alt="' . htmlspecialchars($alt) . '" style="' . $styleString . '" />';
                    break;
                // Add other element types as needed...
                default:
                    $htmlContent .= '<div style="' . $styleString . '">' . htmlspecialchars($element['content'] ?? '') . '</div>';
            }
        }

        return '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($this->title) . '</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; background-color: #f9fafb; }
        .container { max-width: 1200px; margin: 0 auto; }
        img { max-width: 100%; height: auto; }
        a { text-decoration: none; }
        button { cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        ' . $htmlContent . '
    </div>
</body>
</html>';
    }
}