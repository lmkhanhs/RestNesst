package com.pbl5cnpm.airbnb_service.configuration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.mock.web.MockServletContext;
import org.springframework.test.context.support.TestPropertySourceUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

class UploadResourceConfigTest {
    @TempDir Path directory;
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        TestPropertySourceUtils.addInlinedPropertiesToEnvironment(context,
                "upload.directory=" + directory.resolve("uploads"));
        context.register(WebConfiguration.class, UploadResourceConfig.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void servesAnImageCreatedAfterTheApplicationStarted() throws Exception {
        mvc.perform(get("/uploads/new-room.png")).andExpect(status().isNotFound());
        Files.createDirectories(directory.resolve("uploads"));
        byte[] image = { (byte) 0x89, 'P', 'N', 'G' };
        Files.write(directory.resolve("uploads/new-room.png"), image);

        mvc.perform(get("/uploads/new-room.png"))
                .andExpect(status().isOk()).andExpect(content().bytes(image));
    }

    @Test
    void servesNestedUploadsAndFileNamesWithSpaces() throws Exception {
        Path folder = Files.createDirectories(directory.resolve("uploads/rooms"));
        byte[] image = { 1, 2, 3 };
        Files.write(folder.resolve("room & balcony.png"), image);

        mvc.perform(get("/uploads/rooms/{name}", "room & balcony.png"))
                .andExpect(status().isOk()).andExpect(content().bytes(image));
    }

    @Test
    void stillServesBundledUploadsWhenTheFileIsNotOnDisk() throws Exception {
        mvc.perform(get("/uploads/amenities/air-conditioning.svg"))
                .andExpect(status().isOk()).andExpect(content().contentType("image/svg+xml"));
    }

    @Test
    void doesNotServeFilesOutsideTheUploadDirectory() throws Exception {
        Files.createDirectories(directory.resolve("uploads"));
        Files.writeString(directory.resolve("private.txt"), "outside upload directory");
        mvc.perform(get("/uploads/../private.txt")).andExpect(status().isNotFound());
    }

    @TestConfiguration
    @EnableWebMvc
    static class WebConfiguration {
    }
}
