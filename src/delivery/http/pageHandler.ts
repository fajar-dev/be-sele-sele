import { Context } from 'hono';
import { PageUsecase } from '../../usecase/pageUsecase';
import { createPageSchema, updatePageSchema } from './schema';
import { User } from '../../domain/entity/user';

export class PageHandler {
  constructor(private pageUsecase: PageUsecase) {}

  private getUser(c: Context): User {
      return c.get('user') as User;
  }

  async getPages(c: Context) {
    const user = this.getUser(c);
    const page = Number(c.req.query('page') || '1');
    const limit = Number(c.req.query('limit') || '10');
    const ownedQuery = c.req.query('owned');
    let owned: boolean | undefined = undefined;

    if (ownedQuery === 'true') owned = true;
    if (ownedQuery === 'false') owned = false;

    const result = await this.pageUsecase.getPages(user.email, page, limit, owned);
    
    const totalPages = Math.ceil(result.total / limit);

    return c.json({
      success: true,
      message: 'Pages retrieved successfully',
      data: result.data,
      meta: {
        pagination: {
          totalItems: result.total,
          itemCount: result.data.length,
          itemsPerPage: limit,
          totalPages: totalPages,
          currentPage: page
        }
      }
    });
  }

  async getPage(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    const page = await this.pageUsecase.getPage(id, user.email);
    
    if (!page) {
      return c.json({
        success: false,
        message: 'Page not found',
        data: null
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Page retrieved successfully',
      data: page
    });
  }

  async createPage(c: Context) {
    const user = this.getUser(c);
    const body = await c.req.json();
    const result = createPageSchema.safeParse(body);

    if (!result.success) {
      return c.json({ 
        success: false, 
        message: 'Validation failed', 
        data: result.error.format() 
      }, 400);
    }

    const newPage = await this.pageUsecase.createPage(result.data, user.email);
    return c.json({
      success: true,
      message: 'Page created successfully',
      data: newPage
    }, 201);
  }

  async updatePage(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = updatePageSchema.safeParse(body);

    if (!result.success) {
      return c.json({ 
        success: false, 
        message: 'Validation failed', 
        data: result.error.format() 
      }, 400);
    }

    const updatedPage = await this.pageUsecase.updatePage(id, result.data, user.email);
    
    if (!updatedPage) {
      return c.json({ 
        success: false, 
        message: 'Page not found or access denied', 
        data: null 
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Page updated successfully',
      data: updatedPage
    });
  }

  async deletePage(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    const success = await this.pageUsecase.deletePage(id, user.email);

    if (!success) {
      return c.json({ 
        success: false, 
        message: 'Page not found or access denied', 
        data: null 
      }, 404);
    }
    return c.json({
      success: true,
      message: 'Page deleted successfully',
      data: null
    });
  }

  async getMembers(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    const pendingQuery = c.req.query('pending');
    
    let pending: boolean | undefined = undefined;
    if (pendingQuery === 'true') pending = true;
    if (pendingQuery === 'false') pending = false;

    const members = await this.pageUsecase.getMembers(id, user.email, pending);
    if (!members) {
      return c.json({ 
        success: false, 
        message: 'Page not found or access denied', 
        data: null 
      }, 404);
    }
    return c.json({
      success: true,
      message: 'Members retrieved successfully',
      data: members
    });
  }

  async addMember(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ 
        success: false, 
        message: 'Email is required', 
        data: null 
      }, 400);
    }

    const success = await this.pageUsecase.addMember(id, email, user.email);
    if (!success) {
      return c.json({ 
        success: false, 
        message: 'Failed to add member. Check permissions or if user already exists.', 
        data: null 
      }, 400);
    }
    return c.json({
      success: true,
      message: 'Member added successfully',
      data: null
    });
  }

  async removeMember(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ 
        success: false, 
        message: 'Email is required', 
        data: null 
      }, 400);
    }

    const success = await this.pageUsecase.removeMember(id, email, user.email);
    if (!success) {
      return c.json({ 
        success: false, 
        message: 'Failed to remove member. Check permissions.', 
        data: null 
      }, 400);
    }
    return c.json({
      success: true,
      message: 'Member removed successfully',
      data: null
    });
  }

  async updateContent(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    const { content } = await c.req.json();

    if (content === undefined) {
         return c.json({ 
           success: false, 
           message: 'Content is required', 
           data: null 
         }, 400);
    }

    const success = await this.pageUsecase.updateContent(id, content, user.email);
    if (!success) {
      return c.json({ 
        success: false, 
        message: 'Failed to update content. Check permissions.', 
        data: null 
      }, 400); // 403/404
    }
    return c.json({
      success: true,
      message: 'Content updated successfully',
      data: null
    });
  }

  async downloadMarkdown(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    
    const filePath = await this.pageUsecase.getMarkdownFilePath(id, user.email);
    if (!filePath) {
      return c.json({ 
        success: false, 
        message: 'Page not found or access denied', 
        data: null 
      }, 404);
    }

    try {
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
             return c.json({ 
                success: false, 
                message: 'File not found', 
                data: null 
              }, 404);
        }

        return new Response(file, {
            headers: {
                "Content-Type": "text/markdown",
                "Content-Disposition": `attachment; filename="${id}.md"`,
            },
        });
    } catch (e: any) {
        console.error(e);
         return c.json({ 
            success: false, 
            message: 'Error downloading file', 
            data: null 
          }, 500);
    }
  }

  async downloadPdf(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');

    const filePath = await this.pageUsecase.getMarkdownFilePath(id, user.email);
    if (!filePath) {
      return c.json({ 
        success: false, 
        message: 'Page not found or access denied', 
        data: null 
      }, 404);
    }

    try {
        const file = Bun.file(filePath);
        const content = await file.text();

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { mdToPdf } = require('md-to-pdf');
        
        console.log(`[PageHandler] Generating PDF for ${id}...`);
        const pdf = await mdToPdf(
            { content },
            { 
                launch_options: { 
                    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
                } 
            }
        ).catch((err: any) => {
            console.error('[PageHandler] mdToPdf error:', err);
            return null;
        });

        if (!pdf) {
             throw new Error("Failed to generate PDF from content");
        }
        console.log(`[PageHandler] PDF generated for ${id}`);

        // Return PDF content
        return new Response(pdf.content, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${id}.pdf"`,
            },
        });

    } catch (e: any) {
        console.error(e);
        return c.json({ 
            success: false, 
            message: 'Error generating PDF', 
            data: null 
          }, 500);
    }
  }

  async getContent(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    
    const content = await this.pageUsecase.getPageContent(id, user.email);
    
    // Explicit null check. Empty string '' is valid content.
    if (content === null) {
       return c.json({ 
        success: false, 
        message: 'Page not found or access denied', 
        data: null 
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Content retrieved successfully',
      data: {
        content
      }
    });
  }

  async getPermission(c: Context) {
    const user = this.getUser(c);
    const id = c.req.param('id');
    
    const permission = await this.pageUsecase.getPermission(id, user.email);

    return c.json({
      success: true,
      message: 'Permission retrieved successfully',
      data: permission
    });
  }
}
