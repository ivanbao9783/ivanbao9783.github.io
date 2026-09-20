# frozen_string_literal: true

# 知识星图反向链接：在每篇博文末尾注入「所属领域」链接与返回星图入口。
# 归属关系来自 _data/starmap.yml（单一事实源），博文 front matter 不做任何改动。
Jekyll::Hooks.register :posts, :post_convert do |post|
  map = post.site.data["starmap"]
  next if map.nil?

  links = []
  map["clusters"].each do |cluster|
    next if cluster["nodes"].nil?
    cluster["nodes"].each do |node|
      next if node["posts"].nil?
      next unless node["posts"].include?(post.basename)

      links << "<a href=\"/domains/#{cluster['id']}/#{node['id']}/\">#{node['title']}</a>（#{cluster['title']}）"
    end
  end

  next if links.empty?

  footer = +"\n\n<hr>\n<p><strong>所属领域</strong>：#{links.join(' · ')}</p>\n<p><a href=\"/\">← 返回知识星图</a></p>\n"
  post.content = post.content.dup.concat(footer)
end
